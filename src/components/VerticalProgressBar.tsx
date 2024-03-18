import React from 'react';
import {View, StyleSheet} from 'react-native';

type type = 'remote' | 'local';

interface Props {
  capacity: number | Long;
  balance: number | Long;
  type: type;
}

const VerticalProgressBar: React.FC<Props> = props => {
  const {capacity, type, balance} = props;

  let progress = 0;

  if (balance !== undefined && balance !== 0) {
    progress = (capacity / balance) * 100;
  }

  return (
    <View style={styles.container}>
      <View style={progressBarStyle(progress, type)} />
    </View>
  );
};

const progressBarStyle = (progress: number, type: type) => {
  return {
    width: '100%',
    backgroundColor: '#20BB74',
    height: `${progress}%`,
    borderRadius: 1.5,
    marginTop: type === 'remote' ? 65 - (progress * 65) / 100 : 0,
  };
};

const styles = StyleSheet.create({
  container: {
    height: 65,
    width: 11,
    borderRadius: 2,
    backgroundColor: '#E9E9E9',
    marginRight: 20,
  },
});

export default VerticalProgressBar;
