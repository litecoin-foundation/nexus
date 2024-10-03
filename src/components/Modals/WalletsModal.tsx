import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Modal from 'react-native-modal';
// import {useNavigation} from '@react-navigation/native';

import WhiteButton from '../Buttons/WhiteButton';
import ChooseWalletButton from '../Buttons/ChooseWalletButton';

interface Props {
  isVisible: boolean;
  close: () => void;
  currentWallet: string,
}

const WalletsModal: React.FC<Props> = props => {
  const {isVisible, close, currentWallet} = props;
  // const navigation = useNavigation<any>();

  const wallets = (
    <View style={styles.bodyItem}>
        <View style={styles.walletTab}>
          <View style={styles.tabLeft} >
            <Text style={styles.tabLeftTitle}>
              Main wallet
            </Text>
            <Text style={styles.tabLeftAmount}>
              2136 LTC
            </Text>
            <View style={styles.tabLeftWorthContainer}>
              <Text style={styles.tabLeftWorth}>
                $444,444
              </Text>
              <View style={styles.tabLeftWorthChangeIcon} />
              <Text style={styles.tabLeftWorthChange}>
                +17,77%
              </Text>
            </View>
          </View>
          <View style={styles.tabRight}>
            <View style={styles.tabRightCopyIcon} />
            <Text style={styles.tabRightTitle}>
              copy address
            </Text>
          </View>
        </View>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      swipeDirection="down"
      onSwipeComplete={() => close()}
      backdropColor="rgb(19,58,138)"
      backdropOpacity={0.6}
      style={styles.noMargin}>
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.chooseWalletButtonContainer}>
            <ChooseWalletButton
              value={currentWallet}
              onPress={() => close()}
              disabled={false}
              customStyles={styles.chooseWalletButton}
              isBottomCurvesEnabled={true}
              isModalOpened={true}
            />
          </View>
          <View style={styles.body}>
            <View style={styles.bodyItems}>
              {wallets}
              <View style={styles.notificationTab}>
                <Text style={styles.notificationText}>
                  Hardware Wallet support coming soon
                </Text>
              </View>
            </View>
            <WhiteButton
              value="ADD A NEW WALLET"
              onPress={() => {}}
              disabled={true}
              small={false}
              active={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  modal: {
    backgroundColor: '#0d3d8a',
    height: '90%',
    width: '100%',
  },
  chooseWalletButtonContainer: {
    height: Dimensions.get('screen').height * 0.035,
    width: '100%',
    justifyContent: 'center',
    marginTop: Dimensions.get('screen').height * 0.035 * -1,
  },
  chooseWalletButton: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: Dimensions.get('screen').height * 0.01,
    borderTopRightRadius: Dimensions.get('screen').height * 0.01,
  },
  body: {
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Dimensions.get('screen').height * 0.03,
  },
  bodyItems: {
    flex: 1,
    width: '100%',
  },
  bodyItem: {
    height: 'auto',
    width: '100%',
    marginBottom: Dimensions.get('screen').height * 0.03,
  },
  walletTab: {
    height: Dimensions.get('screen').height * 0.14,
    width: '100%',
    borderRadius: Dimensions.get('screen').height * 0.02,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Dimensions.get('screen').height * 0.015,
  },
  tabLeft: {
    flexBasis: '75%',
    height: '90%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  tabLeftTitle: {
    color: '#000',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: Dimensions.get('screen').height * 0.018,
  },
  tabLeftAmount: {
    color: '#000',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.04,
  },
  tabLeftWorthContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tabLeftWorth: {
    color: '#000',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.016,
  },
  tabLeftWorthChangeIcon: {
    height: Dimensions.get('screen').height * 0.02,
    width: Dimensions.get('screen').height * 0.02,
    backgroundColor: 'red',
  },
  tabLeftWorthChange: {
    color: '#000',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.016,
  },
  tabRight: {
    flexBasis: '25%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRadius: Dimensions.get('screen').height * 0.02,
    backgroundColor: '#eee',
  },
  tabRightCopyIcon: {
    height: Dimensions.get('screen').height * 0.035,
    width: Dimensions.get('screen').height * 0.035,
    backgroundColor: 'red',
  },
  tabRightTitle: {
    color: '#000',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: Dimensions.get('screen').height * 0.012,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: Dimensions.get('screen').height * 0.01,
  },
  notificationTab: {
    height: Dimensions.get('screen').height * 0.10,
    width: '100%',
    borderRadius: Dimensions.get('screen').height * 0.02,
    borderWidth: 2,
    borderColor: 'red',
    borderStyle: 'dashed',
    backgroundColor: 'trasnparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'red',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: Dimensions.get('screen').height * 0.018,
  },
  button: {
    height: 50,
    width: 150,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#393e53',
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  noMargin: {
    margin: 0,
  },
});

export default WalletsModal;
