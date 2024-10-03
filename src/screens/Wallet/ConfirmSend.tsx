import React from 'react';
import {SafeAreaView, StyleSheet, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HeaderButton from '../../components/Buttons/HeaderButton';

interface Props {}

const ConfirmSend: React.FC<Props> = () => {
  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <SafeAreaView>
        <Text>Send</Text>
        <Text>0.01LTC</Text>
        <Text>$182.03</Text>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const ConfirmSendNavigationOptions = navigation => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        title="CHANGE"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        title="CANCEL"
        onPress={() => navigation.navigate('AlertsStack')}
        rightPadding={true}
      />
    ),
  };
};

export default ConfirmSend;
