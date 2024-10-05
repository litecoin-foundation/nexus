import React from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import {
  Canvas,
  Fill,
  Image,
  BackdropBlur,
  useImage,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
// import {useNavigation} from '@react-navigation/native';

import WhiteButton from '../Buttons/WhiteButton';
import WalletTab from '../Tabs/WalletTab';

interface Props {
  isVisible: boolean;
  close: () => void;
  currentWallet: string,
}

const fontFamily =
  Platform.OS === 'ios' ? 'Satoshi Variable' : 'SatoshiVariable-Regular.ttf';
const fontStyle = {
  fontFamily,
  fontSize: 30,
  fontStyle: 'normal',
  fontWeight: '700',
};
const font = matchFont(fontStyle);

const WalletsModal: React.FC<Props> = props => {
  const {isVisible, close, currentWallet} = props;
  // const navigation = useNavigation<any>();

  const wallets = (
    <>
      <View style={styles.bodyItem}>
        <WalletTab colorStyle="White" walletName="Main wallet" balance={2136.3} priceRate={65} prevRate={55} />
      </View>
      <View style={styles.bodyItem}>
        <View style={styles.notificationTab}>
          <Text style={styles.notificationText}>
            Hardware Wallet support coming soon
          </Text>
        </View>
      </View>
      <View style={styles.bodyItem}>
        <WalletTab colorStyle="Blue" walletName="Online Payments Wallet" balance={3} priceRate={65} prevRate={55} />
      </View>
      <View style={styles.bodyItem}>
        <WalletTab colorStyle="Blue" walletName="Test Wallet" balance={1} priceRate={65} prevRate={55} />
      </View>
    </>
  );

  return (
    <>
      {isVisible ? (
        <View style={styles.container}>
          <Canvas style={styles.gap} >
            <SkiaText x={100} y={200} text="Hello Test Blur 1234" font={font} color={'#fff'} />
            <BackdropBlur blur={10}>
              <Fill color="rgba(0, 0, 0, 0.1)" />
            </BackdropBlur>
          </Canvas>
          <View style={styles.modal}>
            <View style={styles.body}>
              <View style={styles.bodyItems}>
                {wallets}
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
      ) : (
        <></>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    margin: 0,
    zIndex: 10,
  },
  gap: {
    flex: 1,
    // backgroundColor: 'red',
  },
  modal: {
    backgroundColor: '#0d3d8a',
    height: '75%',
    width: '100%',
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
