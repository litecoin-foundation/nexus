import React, {useEffect, useContext} from 'react';
import {StyleSheet, View, SafeAreaView, Text, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Card from '../../components/Card';
import WhiteButton from '../../components/Buttons/WhiteButton';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {sweepQrKey} from '../../lib/utils/sweep';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getAddress} from '../../reducers/address';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {publishTransaction} from '../../reducers/transaction';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Import: {
    scanData?: string;
  };
  Scan: {returnRoute: string};
  ImportSuccess: {
    txHash: string;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Import'>;
  route: RouteProp<RootStackParamList, 'Import'>;
}

const Import: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const {address} = useAppSelector(state => state.address);

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  // handle scanned QR code
  useEffect(() => {
    const handleScan = async (scanPayload: string) => {
      try {
        const rawTxs = await sweepQrKey(scanPayload, address);
        rawTxs.map(rawTx => {
          rawTx.map(async (txHex: string) => {
            await publishTransaction(txHex);
          });
        });

        navigation.replace('ImportSuccess', {
          txHash: 'SUCCESS',
        });
      } catch (error) {
        Alert.alert(String(error));
      }
    };

    if (route.params?.scanData) {
      handleScan(route.params?.scanData);
    }
  }, [address, route.params?.scanData, dispatch]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <SafeAreaView />

      <View style={styles.cardContainer}>
        <Card
          titleText="Import Private Key"
          descriptionText={
            'Importing a Litecoin private key moves any Litecoin in that wallet into Nexus.\n\nYou will no longer be able to access Litecoin using the private key.'
          }
          imageSource={require('../../assets/images/qr-frame.png')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <WhiteButton
          value="Scan Private Key"
          small={false}
          active={true}
          onPress={() => {
            navigation.navigate('Scan', {returnRoute: 'Import'});
          }}
        />
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
    cardContainer: {
      paddingBottom: screenHeight * 0.15,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 30,
      paddingBottom: 50,
    },
  });

export const ImportNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Import Private Key</Text>
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Import;
