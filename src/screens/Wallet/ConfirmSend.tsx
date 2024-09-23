import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {}

const ConfirmSend: React.FC<Props> = () => {
  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <Text>ConfirmSend</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ConfirmSend;
