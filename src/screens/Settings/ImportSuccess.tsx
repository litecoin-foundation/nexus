import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import {ScreenSizeContext} from '../../context/screenSize';
import WhiteButton from '../../components/Buttons/WhiteButton';
import HeaderButton from '../../components/Buttons/HeaderButton';

type RootStackParamList = {
  ImportSuccess: {
    txHash: string;
  };
  NewWalletStack: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ImportSuccess'>;
  route: RouteProp<RootStackParamList, 'ImportSuccess'>;
}

const ImportSuccess: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <>
      <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
        <View style={styles.body}>
          <Text style={styles.title}>Awesome!</Text>
          <Text style={styles.subtitle}>You just imported Litecoin.</Text>
        </View>

        <View style={styles.confirmButtonContainer}>
          <WhiteButton
            disabled={false}
            small={true}
            active={true}
            value="Back to wallets"
            onPress={() => {
              navigation.navigate('Main', {isInitial: true});
            }}
          />
        </View>
      </LinearGradient>
    </>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: '100%',
    },
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
      bottom: screenHeight * 0.03,
      width: '100%',
      height: screenHeight * 0.125,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
  });

export const ImportSuccessNavigationOptions = navigation => {
  return {
    headerTitle: '',
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

export default ImportSuccess;
