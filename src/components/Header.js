import React, {PureComponent} from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';

export default class Header extends PureComponent {
  render() {
    const {children} = this.props;
    return (
      <LinearGradient
        colors={['#5A4FE7', '#2C44C8']}
        style={DeviceInfo.hasNotch() ? styles.notch : styles.noNotch}>
        <SafeAreaView>{children}</SafeAreaView>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  noNotch: {
    height: 80,
  },
  notch: {
    height: 120,
  },
});
