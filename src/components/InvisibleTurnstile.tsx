import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {StyleSheet, View} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

import {TURNSTILE_BASE_URL} from './turnstileConfig';

const TURNSTILE_SITE_KEY = '0x4AAAAAADIn8s3INEHTpkXG';
const EXECUTE_TIMEOUT_MS = 30000;

export interface InvisibleTurnstileRef {
  execute: () => Promise<string>;
  reset: () => void;
}

interface InvisibleTurnstileProps {
  action?: string;
}

const InvisibleTurnstile = forwardRef<
  InvisibleTurnstileRef,
  InvisibleTurnstileProps
>(({action = ''}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const rejectRef = useRef<((err: Error) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback((result: {token: string} | {error: Error}) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if ('token' in result) {
      resolveRef.current?.(result.token);
    } else {
      rejectRef.current?.(result.error);
    }
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      execute: () =>
        new Promise<string>((resolve, reject) => {
          // Replace any in-flight call
          if (rejectRef.current) {
            rejectRef.current(new Error('Superseded by new execute() call'));
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          resolveRef.current = resolve;
          rejectRef.current = reject;
          timeoutRef.current = setTimeout(() => {
            settle({error: new Error('Verification timed out')});
          }, EXECUTE_TIMEOUT_MS);
          webViewRef.current?.injectJavaScript(
            'window._invokeExecute && window._invokeExecute(); true;',
          );
        }),
      reset: () => {
        webViewRef.current?.injectJavaScript(
          'window._invokeReset && window._invokeReset(); true;',
        );
      },
    }),
    [settle],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: {type: string; token?: string};
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (data.type === 'token' && data.token) {
        settle({token: data.token});
      } else if (data.type === 'expired') {
        settle({error: new Error('Verification expired')});
      } else if (data.type === 'error') {
        settle({error: new Error('Verification failed')});
      }
    },
    [settle],
  );

  const source = useMemo(
    () => ({
      baseUrl: TURNSTILE_BASE_URL,
      html: buildTurnstileHtml(action),
    }),
    [action],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        source={source}
        style={styles.webView}
      />
    </View>
  );
});

const buildTurnstileHtml = (action: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileCb" async defer></script>
    <style>
      html, body { margin: 0; padding: 0; background: transparent; }
      #myWidget { width: 0; height: 0; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="myWidget"></div>
    <script>
      var _widgetId;
      var _ready = false;
      var _pendingExecute = false;
      function _post(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }
      function _turnstileCb() {
        try {
          _widgetId = turnstile.render('#myWidget', {
            sitekey: '${TURNSTILE_SITE_KEY}',
            size: 'invisible',
            execution: 'execute',
            action: '${action}',
            callback: function(token) { _post({ type: 'token', token: token }); },
            'expired-callback': function() { _post({ type: 'expired' }); },
            'error-callback': function() { _post({ type: 'error' }); }
          });
          _ready = true;
          if (_pendingExecute) {
            _pendingExecute = false;
            turnstile.execute(_widgetId);
          }
        } catch (e) {
          _post({ type: 'error' });
        }
      }
      window._invokeExecute = function() {
        if (_ready && _widgetId !== undefined) {
          try { turnstile.reset(_widgetId); } catch (e) {}
          try { turnstile.execute(_widgetId); } catch (e) { _post({ type: 'error' }); }
        } else {
          _pendingExecute = true;
        }
      };
      window._invokeReset = function() {
        if (_ready && _widgetId !== undefined) {
          try { turnstile.reset(_widgetId); } catch (e) {}
        }
      };
    </script>
  </body>
</html>`;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  webView: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});

export default InvisibleTurnstile;
