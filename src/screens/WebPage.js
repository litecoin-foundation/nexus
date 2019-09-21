import React from 'react';
import {View, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';
import {useNavigationParam} from 'react-navigation-hooks';

const WebPage = () => {
  const uri = useNavigationParam('uri');
  return (
    <View style={styles.container}>
      <WebView style={styles.webview} source={{uri}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {},
});

export default WebPage;
