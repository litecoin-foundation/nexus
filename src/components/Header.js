import React, {PureComponent} from 'react';
import {StyleSheet, SafeAreaView, View, Dimensions} from 'react-native';

export default class Header extends PureComponent {
  render() {
    const {children} = this.props;
    return (
      <View style={styles.container}>
        <SafeAreaView>{children}</SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get('screen').height * 0.13,
    backgroundColor: '#1162E6',
  },
});
