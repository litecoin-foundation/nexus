import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

import WhiteButton from '../../components/Buttons/WhiteButton';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  ImportSuccess: {
    txHash: string;
  };
  NewWalletStack: undefined;
  Main: {
    isInitial: boolean;
  };
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ImportSuccess'>;
  route: RouteProp<RootStackParamList, 'ImportSuccess'>;
}

const ImportSuccess: React.FC<Props> = props => {
  const {navigation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <LinearGradient style={styles.container} colors={['#1162E6', '#0F55C7']}>
      <View style={styles.body}>
        <TranslateText
          textKey="awesome"
          domain="settingsTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.07}
          textStyle={styles.title}
          numberOfLines={1}
        />
        <TranslateText
          textKey="success_import"
          domain="settingsTab"
          maxSizeInPixels={SCREEN_HEIGHT * 0.022}
          textStyle={styles.subtitle}
          numberOfLines={3}
        />
      </View>

      <View style={styles.confirmButtonContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
          <WhiteButton
            textKey="back_to_wallet"
            textDomain="settingsTab"
            disabled={false}
            small={false}
            active={true}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{name: 'NewWalletStack', params: {screen: 'Main', params: {isInitial: true}}}],
              });
            }}
          />
        </CustomSafeAreaView>
      </View>
    </LinearGradient>
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
      fontSize: screenHeight * 0.05,
      textAlign: 'center',
      marginTop: screenHeight * 0.05 * -1,
    },
    subtitle: {
      width: '100%',
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.02,
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: screenHeight * 0.005,
    },
    confirmButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.01,
      width: '100%',
      paddingHorizontal: screenWidth * 0.06,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    safeArea: {},
  });

export const ImportSuccessNavigationOptions = (): StackNavigationOptions => {
  return {
    headerTitle: () => null,
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => null,
    gestureEnabled: false,
  };
};

export default ImportSuccess;
