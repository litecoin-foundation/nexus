import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

import {TURNSTILE_BASE_URL} from './turnstileConfig';

const TURNSTILE_SITE_KEY = '0x4AAAAAACNSgnC0ANAjDu9H';
const TURNSTILE_SIZE = 'normal';
const DEFAULT_HEIGHT = 80;
// How long to wait for the widget to report that it mounted before assuming
// the page or Cloudflare's script never loaded.
const LOAD_TIMEOUT_MS = 12000;

interface TurnstileProps {
  onTokenReceived: (token: string) => void;
  onTokenExpired?: () => void;
  onError?: (reason?: string) => void;
  action?: string;
  resetKey?: number;
}

const Turnstile: React.FC<TurnstileProps> = ({
  onTokenReceived,
  onTokenExpired,
  onError,
  action = '',
  resetKey = 0,
}) => {
  const [webViewHeight, setWebViewHeight] = useState(DEFAULT_HEIGHT);

  // Keep the latest callbacks in a ref so handleMessage stays referentially
  // stable — the parent recreates these handlers on every render.
  const callbacksRef = useRef({onTokenReceived, onTokenExpired, onError});
  useEffect(() => {
    callbacksRef.current = {onTokenReceived, onTokenExpired, onError};
  }, [onTokenReceived, onTokenExpired, onError]);

  // Cloudflare reports at most one fatal error per widget instance, and the
  // parent remounts us in response — only report once per instance so a
  // permanent failure (bad sitekey, disallowed domain) can't loop.
  const erroredRef = useRef(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const fail = useCallback(
    (reason: string) => {
      clearLoadTimer();
      if (erroredRef.current) return;
      erroredRef.current = true;
      callbacksRef.current.onError?.(reason);
    },
    [clearLoadTimer],
  );

  useEffect(() => {
    erroredRef.current = false;
    loadTimerRef.current = setTimeout(() => {
      fail('Verification could not load. Check your connection and try again.');
    }, LOAD_TIMEOUT_MS);
    return clearLoadTimer;
  }, [resetKey, fail, clearLoadTimer]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: {type?: string; token?: string; height?: number; text?: string};
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      const {onTokenReceived: onToken, onTokenExpired: onExpired} =
        callbacksRef.current;

      switch (data.type) {
        case 'ready':
          // The script loaded and render() returned — stop the load watchdog.
          // A visible widget may still need the user to tick the checkbox.
          clearLoadTimer();
          break;
        case 'height':
          if (typeof data.height === 'number') setWebViewHeight(data.height);
          break;
        case 'token':
          if (data.token) {
            clearLoadTimer();
            onToken(data.token);
          }
          break;
        case 'expired':
          onExpired?.();
          break;
        case 'error':
          fail(errorReason(data.text));
          break;
        case 'console':
          // Turnstile reports configuration failures (e.g. 110200 "domain not
          // allowed") only via console.error — error-callback never fires for
          // them, so without this the widget fails completely silently.
          if (__DEV__) console.warn('[Turnstile]', data.text);
          if (data.text && /turnstile/i.test(data.text)) {
            fail(errorReason(data.text));
          }
          break;
      }
    },
    [clearLoadTimer, fail],
  );

  // A new source object reloads the WebView, which would restart an in-flight
  // challenge on every parent re-render (e.g. each keystroke in the email field).
  const source = useMemo(
    () => ({baseUrl: TURNSTILE_BASE_URL, html: buildTurnstileHtml(action)}),
    [action],
  );

  return (
    <View style={[styles.container, {height: webViewHeight}]}>
      <WebView
        key={resetKey}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        source={source}
        style={styles.webView}
        onError={() => fail('Verification could not load.')}
        onHttpError={() => fail('Verification could not load.')}
      />
    </View>
  );
};

// Turnstile error codes are 6 digits; surfacing the raw code makes an otherwise
// opaque failure diagnosable (110200 = domain not on the sitekey's allow list).
const errorReason = (text?: string) => {
  const code = text && /\b(\d{6})\b/.exec(text);
  if (code) {
    return __DEV__
      ? `Verification failed (Turnstile ${code[1]}).`
      : 'Verification failed. Please try again.';
  }
  return 'Verification failed. Please try again.';
};

const buildTurnstileHtml = (action: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <script>
      function _post(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }
      // Turnstile logs config errors here instead of calling error-callback.
      var _origConsoleError = console.error;
      console.error = function() {
        var text = Array.prototype.map.call(arguments, String).join(' ');
        _post({ type: 'console', text: text });
        _origConsoleError.apply(console, arguments);
      };
      window.onerror = function(message) {
        _post({ type: 'console', text: 'Turnstile ' + String(message) });
      };
    </script>
    <script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileCb"
      async defer
      onerror="_post({ type: 'error', text: 'script failed to load' })"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      #myWidget {
        display: flex;
      }
    </style>
  </head>
  <body>
    <div id="myWidget"></div>
    <script>
      var _widgetId;
      var _sent = false;
      var _poll;
      var _expiryWatch;

      function _postHeight() {
        var widget = document.getElementById('myWidget');
        _post({ type: 'height', height: widget ? widget.offsetHeight : ${DEFAULT_HEIGHT} });
      }

      function _emitToken(token) {
        if (_sent || !token) return;
        _sent = true;
        if (_poll) { clearInterval(_poll); _poll = null; }
        _post({ type: 'token', token: token });
        _startExpiryWatch();
      }

      function _emitExpired() {
        if (!_sent) return;
        _sent = false;
        if (_expiryWatch) { clearInterval(_expiryWatch); _expiryWatch = null; }
        _post({ type: 'expired' });
      }

      // None of render()'s callbacks are invoked in this WebView — not callback,
      // not expired-callback, not error-callback. Everything therefore has to be
      // observed by polling the widget's own state instead.
      function _startPolling() {
        if (_poll) return;
        var ticks = 0;
        _poll = setInterval(function() {
          ticks++;
          var resp;
          try {
            resp = turnstile.getResponse(_widgetId);
          } catch (e) {
            resp = undefined;
          }
          if (resp) _emitToken(resp);
          // Tokens are only valid ~300s, so a challenge unsolved past that is dead.
          if (ticks > 600) { clearInterval(_poll); _poll = null; }
        }, 500);
      }

      // A token goes stale after ~300s. With expired-callback dead, the app would
      // otherwise submit a token the server rejects.
      function _startExpiryWatch() {
        if (_expiryWatch) return;
        _expiryWatch = setInterval(function() {
          var expired = false;
          try {
            expired = turnstile.isExpired(_widgetId);
          } catch (e) {
            expired = false;
          }
          if (expired) _emitExpired();
        }, 5000);
      }

      function _turnstileCb() {
        try {
          _widgetId = turnstile.render('#myWidget', {
            sitekey: '${TURNSTILE_SITE_KEY}',
            size: '${TURNSTILE_SIZE}',
            action: '${action}',
            callback: function(token) { _emitToken(token); },
            'expired-callback': function() { _emitExpired(); },
            'error-callback': function(code) { _post({ type: 'error', text: String(code) }); }
          });
        } catch (e) {
          _post({ type: 'error', text: String(e && e.message) });
          return;
        }
        _post({ type: 'ready' });
        _startPolling();
        setTimeout(_postHeight, 1000);
        window.addEventListener('resize', function() {
          setTimeout(_postHeight, 100);
        });
      }
    </script>
  </body>
</html>`;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default Turnstile;
