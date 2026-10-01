import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from 'react-native';
import WebView from 'react-native-webview';
import type {
  WebViewNavigation,
  WebViewNavigationEvent,
  WebViewErrorEvent,
  ShouldStartLoadRequest,
  FileDownloadEvent,
} from 'react-native-webview/lib/WebViewTypes';
import DeviceInfo from 'react-native-device-info';
import {
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import {RouteProp, useNavigation} from '@react-navigation/native';

import ScreenHeader, {
  ScreenHeaderCard,
  ScreenHeaderNavigationOptions,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../components/ScreenHeader';
import CustomSafeAreaView from '../components/CustomSafeAreaView';

type RootStackParamList = {
  WebPage: {
    uri: string;
    observeURL?: string;
    returnRoute?: string;
    title?: string;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'WebPage'>;
}

const WebPage: React.FC<Props> = props => {
  const {route} = props;
  const WebPageRef = useRef<WebView>(null);
  const navigation = useNavigation();

  // Presented as a modal card on iOS only, see WebPageNavigationOptions
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout(
    Platform.OS === 'ios',
  );
  const headerFadeStyle = useScreenHeaderArrival();

  const [ableToGoBack, setCanGoBack] = useState(false);
  const [ableToGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const {observeURL, returnRoute, title} = route.params || {};

  const handleEvent = useCallback(
    (syntheticEvent: WebViewNavigationEvent | WebViewErrorEvent) => {
      const {canGoBack, canGoForward, loading} = syntheticEvent.nativeEvent;

      setCanGoBack(canGoBack);
      setCanGoForward(canGoForward);
      setIsLoading(loading);
    },
    [],
  );

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      const {url} = request;
      // Handle Apple Wallet .pkpass files
      if (
        url.endsWith('.pkpass') ||
        url.includes('mime=application/vnd.apple.pkpass') ||
        url.includes('content-type=application/vnd.apple.pkpass')
      ) {
        Linking.openURL(url).catch(() => {});
        return false;
      }

      // Handle Google Wallet deep links (Android intent:// scheme), scoped to
      // Google Wallet packages so page content can't launch arbitrary apps.
      // Always return false so the WebView never tries to load intent:// itself
      // (which would fail with ERR_UNKNOWN_URL_SCHEME).
      if (Platform.OS === 'android' && url.startsWith('intent://')) {
        const intentPackage = url.match(/;package=([^;]+)/)?.[1];
        const allowedPackages = [
          'com.google.android.apps.walletnfcrel',
          'com.google.android.gms',
        ];
        if (intentPackage && allowedPackages.includes(intentPackage)) {
          Linking.openURL(url).catch(() => {});
        }
        return false;
      }

      // Handle Google Wallet
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        // Not a parseable URL — let the WebView load it as-is.
        return true;
      }
      const isGooglePaySaveUrl =
        parsedUrl.protocol === 'https:' &&
        parsedUrl.hostname === 'pay.google.com' &&
        parsedUrl.pathname.startsWith('/gp/v/save/');
      const isGoogleWalletHost =
        parsedUrl.protocol === 'https:' &&
        (parsedUrl.hostname === 'wallet.google.com' ||
          parsedUrl.hostname.endsWith('.wallet.google.com'));

      if (isGooglePaySaveUrl || isGoogleWalletHost) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
      return true;
    },
    [],
  );

  const handleFileDownload = useCallback(
    ({nativeEvent: {downloadUrl}}: FileDownloadEvent) => {
      Linking.openURL(downloadUrl).catch(() => {});
    },
    [],
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCurrentUrl(navState.url);
    },
    [],
  );

  // handle observing current url
  useEffect(() => {
    if (observeURL && currentUrl) {
      const urlWithoutQuery = currentUrl.split('?')[0];
      if (urlWithoutQuery === observeURL) {
        const queryString = currentUrl.split('?')[1];
        if (returnRoute) {
          navigation.navigate(returnRoute as any, {
            queryString: queryString || 'empty',
          });
        }
      }
    }
  }, [currentUrl, observeURL, returnRoute, navigation]);

  return (
    <CustomSafeAreaView styles={styles.container} edges={['bottom']}>
      <View style={[styles.container, {paddingTop: cardHeight}]}>
        <WebView
          style={styles.webview}
          source={{uri: route.params.uri}}
          ref={WebPageRef}
          enableApplePay
          onLoadStart={handleEvent}
          onLoadEnd={handleEvent}
          originWhitelist={[
            'https://*',
            'http://*',
            'about:blank',
            'about:srcdoc',
          ]}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          applicationNameForUserAgent={`lndmobile-${DeviceInfo.getVersion()}/${DeviceInfo.getSystemName()}:${DeviceInfo.getSystemVersion()}`}
          allowsInlineMediaPlayback
          onFileDownload={handleFileDownload}
        />
      </View>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          onPress={() => {
            WebPageRef.current?.goBack();
          }}
          disabled={!ableToGoBack}>
          <Image
            style={ableToGoBack ? null : styles.opacity}
            source={require('../assets/images/previous.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => WebPageRef.current?.reload()}>
          <Image
            source={
              isLoading
                ? require('../assets/images/close-white.png')
                : require('../assets/images/refresh.png')
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => WebPageRef.current?.goForward()}
          disabled={!ableToGoForward}
          style={ableToGoForward ? null : styles.opacity}>
          <Image
            style={ableToGoForward ? null : styles.opacity}
            source={require('../assets/images/next.png')}
          />
        </TouchableOpacity>
      </View>
      <ScreenHeaderCard cardHeight={cardHeight} rounded={false} />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleValue={title}
        fadeStyle={headerFadeStyle}
      />
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    height: 400,
  },
  optionsContainer: {
    height: 100,
    backgroundColor: '#1D385F',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  opacity: {
    opacity: 0.4,
  },
});

export const WebPageNavigationOptions: StackNavigationOptions = {
  ...(Platform.OS === 'ios' ? TransitionPresets.ModalPresentationIOS : {}),
  ...ScreenHeaderNavigationOptions,
};

export default WebPage;
