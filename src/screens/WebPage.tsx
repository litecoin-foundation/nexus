import React, {useEffect, useRef, useState, useContext} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from 'react-native';
import WebView from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import {TransitionPresets} from '@react-navigation/stack';
import {RouteProp, useNavigation} from '@react-navigation/native';

import Header from '../components/Header';
import HeaderButton from '../components/Buttons/HeaderButton';

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
        headerTitle: title,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: 'white',
          fontWeight: '600',
          fontSize: SCREEN_HEIGHT * 0.025,
          letterSpacing: 0.35,
        },
        headerTitleContainerStyle: styles.headerTitleContainer,
      });
    }
  }, [title, navigation, SCREEN_HEIGHT]);

  const handleEvent = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    const {canGoBack, canGoForward, loading} = nativeEvent;

    setCanGoBack(canGoBack);
    setCanGoForward(canGoForward);
    setIsLoading(loading);
  };

  // handle observing current url
  useEffect(() => {
    if (observeURL && currentUrl) {
      const urlWithoutQuery = currentUrl.split('?')[0];
      if (urlWithoutQuery === observeURL) {
        const queryString = currentUrl.split('?')[1];
        if (returnRoute) {
          navigation.navigate(returnRoute, {
            queryString: queryString || 'empty',
          });
        }
      }
    }
  }, [currentUrl, observeURL, returnRoute, navigation]);

  return (
    <CustomSafeAreaView styles={styles.container} edges={['bottom']}>
      <Header modal={Platform.OS === 'android' ? false : true} />
      <WebView
        style={styles.webview}
        source={{uri: route.params.uri}}
        ref={WebPageRef}
        enableApplePay={true}
        onLoadStart={syntheticEvent => handleEvent(syntheticEvent)}
        onLoadEnd={syntheticEvent => handleEvent(syntheticEvent)}
        originWhitelist={[
          'https://*',
          'http://*',
          'about:blank',
          'about:srcdoc',
        ]}
        onShouldStartLoadWithRequest={request => {
          const {url} = request;
          // Handle Apple Wallet .pkpass files
          if (
            url.endsWith('.pkpass') ||
            url.includes('mime=application/vnd.apple.pkpass') ||
            url.includes('content-type=application/vnd.apple.pkpass')
          ) {
            Linking.openURL(url);
            return false;
          }
          // Handle Google Wallet
          if (
            url.startsWith('https://pay.google.com/gp/v/save/') ||
            url.startsWith('intent://') ||
            url.startsWith('https://wallet.google.com') ||
            url.startsWith('https://wallet.google')
          ) {
            Linking.openURL(url);
            return false;
          }
          return true;
        }}
        onNavigationStateChange={syntheticEvent =>
          setCurrentUrl(syntheticEvent.url)
        }
        applicationNameForUserAgent={`lndmobile-${DeviceInfo.getVersion()}/${DeviceInfo.getSystemName()}:${DeviceInfo.getSystemVersion()}`}
        allowsInlineMediaPlayback={true}
        onFileDownload={({nativeEvent: {downloadUrl}}) => {
          Linking.openURL(downloadUrl);
        }}
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
