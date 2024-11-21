import React, {PureComponent} from 'react';
import {StyleSheet, SafeAreaView, View, Dimensions} from 'react-native';

interface Props {
  children?: React.ReactNode;
  modal?: boolean;
}

export default class Header extends PureComponent<Props> {
  render() {
    const {children, modal} = this.props;
    return (
      <View
        style={[
          styles.container,
          modal ? {height: Dimensions.get('screen').height * 0.1} : null,
        ]}>
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
