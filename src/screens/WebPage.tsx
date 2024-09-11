import React, {useRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import WebView from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import {TransitionPresets} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import Header from '../components/Header';
import HeaderButton from '../components/Buttons/HeaderButton';

type RootStackParamList = {
  WebPage: undefined;
};

interface Props {
  route: RouteProp<RootStackParamList, 'WebPage'>;
}

const WebPage: React.FC<Props> = props => {
  const {route} = props;
  const WebPageRef = useRef();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEvent = syntheticEvent => {
    const {nativeEvent} = syntheticEvent;
    const {canGoBack, canGoForward, loading} = nativeEvent;

    setCanGoBack(canGoBack);
    setCanGoForward(canGoForward);
    setIsLoading(loading);
  };

  return (
    <View style={styles.container}>
      <Header modal={true} />
      <WebView
        style={styles.webview}
        source={route.params}
        ref={WebPageRef}
        enableApplePay={true}
        onLoadStart={syntheticEvent => handleEvent(syntheticEvent)}
        onLoadEnd={syntheticEvent => handleEvent(syntheticEvent)}
        applicationNameForUserAgent={`lndmobile-${DeviceInfo.getVersion()}/${DeviceInfo.getSystemName()}:${
          DeviceInfo.getSystemVersion
        }`}
      />
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          onPress={() => {
            WebPageRef.current.goBack();
          }}
          disabled={!canGoBack}>
          <Image
            style={canGoBack ? null : styles.opacity}
            source={require('../assets/images/previous.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => WebPageRef.current.reload()}>
          <Image
            source={
              isLoading
                ? require('../assets/images/close-white.png')
                : require('../assets/images/refresh.png')
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => WebPageRef.current.goForward()}
          disabled={!canGoForward}
          style={canGoForward ? null : styles.opacity}>
          <Image
            style={canGoForward ? null : styles.opacity}
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

export const WebPageNavigationOptions = navigation => {
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
          title="BACK"
        />
      </View>
    ),
  };
};

export default WebPage;
