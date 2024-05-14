import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface Props {}

const ConfirmSend: React.FC<Props> = () => {
  return (
    <View style={styles.container}>
      <Text>ConfirmSend</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1162E6',
  },
});

export default ConfirmSend;
