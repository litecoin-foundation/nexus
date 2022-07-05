import {lnrpc} from '@litecoinfoundation/react-native-lndltc';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

interface Props {
  onPress: () => void;
  data: lnrpc.ILightningNode;
}

const ChannelSearchCell = (props: Props) => {
  const {onPress, data} = props;
  const {alias, pubKey} = data;
  const pubKeyNoIP = pubKey!.split('@')[0];

  return (
    <View style={styles.container}>
      <View style={styles.detailsContainer}>
        <View style={styles.leftContainer}>
          <Text style={styles.headerText}>NODE NAME</Text>
          <Text style={styles.labelText}>{alias}</Text>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.headerText}>NODE IP & PUBKEY</Text>
          <Text style={styles.labelText}>
            {pubKeyNoIP.substring(0, 8)}...{pubKeyNoIP.substring(57, 65)}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
          <Text style={styles.buttonText}>Create Channel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: 125,
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
  labelText: {
    color: 'rgb(74,74,74)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.58,
    paddingTop: 2,
  },
  buttonContainer: {
    height: 50,
    width: '100%',
    backgroundColor: '#2C72FF',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 0,
    position: 'absolute',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  headerText: {
    color: '#7C96AE',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
  detailsContainer: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContainer: {
    height: 75,
    justifyContent: 'center',
    flexGrow: 1,
    paddingLeft: 20,
    borderRightWidth: 1,
    borderColor: 'rgba(151,151,151,0.3)',
    flexBasis: 0,
  },
  rightContainer: {
    height: 75,
    justifyContent: 'center',
    flexGrow: 1,
    paddingLeft: 20,
    flexBasis: 0,
  },
});

export default ChannelSearchCell;
