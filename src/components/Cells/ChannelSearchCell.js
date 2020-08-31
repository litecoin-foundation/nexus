import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';

import GreyRoundButton from '../Buttons/GreyRoundButton';

const ChannelSearchCell = (props) => {
  const {onPress, data} = props;
  const {alias, pubKey} = data;
  const pubKeyNoIP = pubKey.split('@')[0];

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.left}>
          <Text style={styles.labelText}>{alias}</Text>
          <Text style={styles.differenceText}>
            {pubKeyNoIP.substring(0, 13)}...{pubKeyNoIP.substring(50, 65)}
          </Text>
        </View>
        <View style={styles.right}>
          <GreyRoundButton onPress={onPress} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: 70,
    width: Dimensions.get('window').width - 30,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 15,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    shadowOffset: {
      height: 3,
      width: 0,
    },
  },
  left: {
    flexGrow: 2,
    paddingLeft: 15,
  },
  right: {
    flexGrow: 2,
    paddingRight: 15,
    alignItems: 'flex-end',
  },
  labelText: {
    color: '#484859',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.19,
  },
  differenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: -0.17,
    textAlign: 'left',
    color: '#20BB74',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ChannelSearchCell;
