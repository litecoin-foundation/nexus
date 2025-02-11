import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface Props {}

const Convert: React.FC<Props> = props => {
  const {} = props;
  return (
    <View>
      <Text>Litecoin Balance</Text>
      <Text>MWEB Balance</Text>
    </View>
  );
};

const styles = StyleSheet.create({});

export default Convert;
