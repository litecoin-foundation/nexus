import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

interface Props {
  index: number;
  value: string;
}

const SeedView: React.FC<Props> = props => {
  const {index, value} = props;
  return (
    <View style={styles.container}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{index}</Text>
      </View>

      <Text style={styles.text}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: 335,
    backgroundColor: 'white',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  numberContainer: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(151, 151, 151, 0.3)',
    height: 40,
    justifyContent: 'center',
  },
  number: {
    fontFamily: 'Satoshi Variable',
    color: '#3873FF',
    fontSize: 20,
    fontWeight: 'bold',
    width: 65,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    color: '#2e2e2e',
    fontSize: 24,
    flexGrow: 4,
    paddingLeft: 20,
  },
});

export default SeedView;
