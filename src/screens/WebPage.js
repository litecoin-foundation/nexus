import React, {useRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import WebView from 'react-native-webview';

import Header from '../components/Header';

const WebPage = props => {
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
        onLoadStart={syntheticEvent => handleEvent(syntheticEvent)}
        onLoadEnd={syntheticEvent => handleEvent(syntheticEvent)}
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
});

export default WebPage;
