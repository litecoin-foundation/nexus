import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import WebView from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import {TransitionPresets} from '@react-navigation/stack';
import {RouteProp, useNavigation} from '@react-navigation/native';

import Header from '../components/Header';
import HeaderButton from '../components/Buttons/HeaderButton';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type RootStackParamList = {
  WebPage: {
    uri: string;
    observeURL?: string;
    returnRoute?: string;
  };
};

interface Props {
  route: RouteProp<RootStackParamList, 'WebPage'>;
}

const WebPage: React.FC<Props> = props => {
  const {route} = props;
  const insets = useSafeAreaInsets();
  const WebPageRef = useRef<WebView>(null);
  const navigation = useNavigation();

  const [ableToGoBack, setCanGoBack] = useState(false);
  const [ableToGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const {observeURL, returnRoute} = route.params || {};

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
    <View
      style={[
        styles.container,
        Platform.OS === 'android' ? {paddingBottom: insets.bottom} : null,
      ]}>
      <Header modal={true} />
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
        onNavigationStateChange={syntheticEvent =>
          setCurrentUrl(syntheticEvent.url)
        }
        applicationNameForUserAgent={`lndmobile-${DeviceInfo.getVersion()}/${DeviceInfo.getSystemName()}:${DeviceInfo.getSystemVersion()}`}
        allowsInlineMediaPlayback={true}
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
    </View>
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
});

export const WebPageNavigationOptions = (navigation: any) => {
  return {
    ...TransitionPresets.ModalPresentationIOS,
    headerTitle: '',
    headerTransparent: true,
    headerBackTitleVisible: false,
    headerTintColor: 'white',
    headerLeft: () => (
      <View style={styles.headerButtonContainer}>
        <HeaderButton
          onPress={() => navigation.goBack()}
          imageSource={require('../assets/images/back-icon.png')}
          textKey="back"
          textDomain="buyTab"
        />
      </View>
    ),
  };
};

export default WebPage;
