import React, {PureComponent} from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default class Header extends PureComponent {
  render() {
    const {children} = this.props;
    return (
      <LinearGradient colors={['#5A4FE7', '#2C44C8']} style={styles.container}>
        <SafeAreaView>{children}</SafeAreaView>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 54,
  },
});
