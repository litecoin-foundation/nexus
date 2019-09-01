import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

const SeedView = props => {
  const {index, value} = props;
  return (
    <View style={styles.container}>
      <Text>{index}</Text>
      <Text>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 65,
    width: 350,
    backgroundColor: 'white',
    borderRadius: 7,
    marginTop: 10,
  },
});

SeedView.propTypes = {
  index: PropTypes.number.isRequired,
  value: PropTypes.string.isRequired,
};

export default SeedView;
