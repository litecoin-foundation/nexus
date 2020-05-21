import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import PropTypes from 'prop-types';

import VerticalProgressBar from '../VerticalProgressBar';

const {width} = Dimensions.get('window');

const ChannelCell = (props) => {
  const {item} = props;
  const {
    remotePubkey,
    channelPoint,
    capacity,
    localBalance,
    remoteBalance,
  } = item;
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.subcontainer}>
          <Text style={styles.titleText}>NODE NAME</Text>
          <Text style={styles.text}>WIP</Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.subcontainer}>
          <Text style={styles.titleText}>NODE PUBKEY</Text>
          <Text style={styles.text}>{remotePubkey}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.subcontainer}>
          <Text style={styles.titleText}>FUNDING TRANSACTION</Text>
          <Text style={styles.text}>{channelPoint}</Text>
        </View>
      </View>

      <View style={[styles.subcontainer, styles.channel]}>
        <Text style={styles.titleText}>CHANNEL CAPACITY</Text>
        <View style={styles.channelSubContainer}>
          <View style={styles.capacityContainer}>
            <VerticalProgressBar balance={localBalance} capacity={capacity} />
            <View>
              <Text>Local Capacity</Text>
              <Text>{localBalance}</Text>
            </View>
          </View>
        </View>
        <View style={styles.channelSubContainer}>
          <View>
            <Text>Capacity</Text>
            <Text>{capacity}</Text>
          </View>
        </View>

        <View style={styles.channelSubContainer}>
          <View style={styles.capacityContainer}>
            <VerticalProgressBar
              balance={remoteBalance}
              capacity={capacity}
              type="remote"
            />
            <View>
              <Text>Remote Capacity</Text>
              <Text>{remoteBalance}</Text>
            </View>
          </View>
        </View>
      </View>
      <View
        style={[styles.subcontainer, styles.channelBottomDescriptorContainer]}>
        <Text style={styles.titleText}>CHANNEL OPENING DATE</Text>
        <Text style={styles.text}>WIP 15, 2019, 1:26 PM</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    width: width - 60,
    borderRadius: 10,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  section: {
    borderBottomColor: '#979797',
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  subcontainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  channelSubContainer: {
    height: 65,
  },
  channelBottomDescriptorContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  titleText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 7,
  },
  text: {
    color: '#4A4A4A',
    fontSize: 15,
    fontWeight: '600',
  },
  channel: {
    backgroundColor: '#F6F9FC',
    paddingTop: 15,
    paddingBottom: 15,
  },
  capacityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

ChannelCell.propTypes = {
  item: PropTypes.shape({
    remotePubkey: PropTypes.string.isRequired,
    channelPoint: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    localBalance: PropTypes.number.isRequired,
    remoteBalance: PropTypes.number.isRequired,
  }),
};

export default ChannelCell;
