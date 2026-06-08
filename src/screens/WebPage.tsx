import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from 'react';
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
import {TransitionPresets} from '@react-navigation/stack';
import {RouteProp, useNavigation} from '@react-navigation/native';

import Header from '../components/Header';
import HeaderButton from '../components/Buttons/HeaderButton';

import TranslateText from '../components/TranslateText';
import CustomSafeAreaView from '../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../context/screenSize';

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

const HeaderTitle = ({title, fontSize}: {title: string; fontSize: number}) => (
  <TranslateText
    textValue={title}
    maxSizeInPixels={fontSize}
    textStyle={[styles.headerTitleText, {fontSize}]}
    numberOfLines={1}
  />
);

const WebPage: React.FC<Props> = props => {
  const {route} = props;
  const WebPageRef = useRef<WebView>(null);
  const navigation = useNavigation();

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const [ableToGoBack, setCanGoBack] = useState(false);
  const [ableToGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const {observeURL, returnRoute, title} = route.params || {};

  useEffect(() => {
    if (title) {
      navigation.setOptions({
        // eslint-disable-next-line react/no-unstable-nested-components
        headerTitle: () => (
          <HeaderTitle title={title} fontSize={SCREEN_HEIGHT * 0.022} />
        ),
        headerTitleAlign: 'center',
        headerTitleContainerStyle: styles.headerTitleContainer,
      });
    }
  }, [title, navigation, SCREEN_HEIGHT]);

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
      <Header modal={Platform.OS !== 'android'} />
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
  headerButtonContainer: {
    paddingTop: 30,
  },
  headerTitleContainer: {
    paddingTop: 30,
  },
  headerTitleText: {
    color: '#fff',
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
  },
});

export const WebPageNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH} = useContext(ScreenSizeContext);

  const presentation =
    Platform.OS === 'ios' ? {...TransitionPresets.ModalPresentationIOS} : {};
  return {
    ...presentation,
    headerTitle: '',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <View style={styles.headerButtonContainer}>
        <HeaderButton
          onPress={() => navigation.goBack()}
          imageSource={require('../assets/images/back-icon.png')}
          leftPadding
          textKey="back"
          textDomain="buyTab"
        />
      </View>
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default WebPage;
