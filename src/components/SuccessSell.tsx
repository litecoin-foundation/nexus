import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import WhiteButton from './Buttons/WhiteButton';

import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  toAmount: number;
  saleTxid: string;
}

const SuccessSell: React.FC<Props> = props => {
  const {toAmount, saleTxid} = props;
  const navigation = useNavigation<any>();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <>
      <View style={styles.body}>
        <TranslateText
          textKey="awesome"
          domain="settingsTab"
          textStyle={styles.title}
        />
        <TranslateText
          textKey="sell_success"
          domain="sellTab"
          textStyle={styles.subtitle}
          interpolationObj={{
            amount: toAmount,
          }}
        />

        <View style={styles.toAddressContainer}>
          <Text style={styles.toAddressText}>{saleTxid}</Text>
        </View>
      </View>

      <View style={styles.confirmButtonContainer}>
        <WhiteButton
          textKey="back_to_wallet"
          textDomain="settingsTab"
          disabled={false}
          small={true}
          active={true}
          onPress={() => {
            navigation.navigate('Main', {isInitial: true});
          }}
        />
      </View>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    body: {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenHeight * 0.03,
    },
    title: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.07,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.016,
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
      width: '100%',
      height: screenHeight * 0.1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toAddressContainer: {
      width: 'auto',
      height: 'auto',
      borderRadius: screenHeight * 0.012,
      backgroundColor: 'rgba(240, 240, 240, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: screenHeight * 0.05,
      paddingLeft: screenWidth * 0.05,
      paddingRight: screenWidth * 0.05,
      paddingTop: screenWidth * 0.02,
      paddingBottom: screenWidth * 0.02,
    },
    toAddressText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: screenHeight * 0.025,
      textAlign: 'center',
    },
  });

export default SuccessSell;
