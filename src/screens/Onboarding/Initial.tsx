import React, {useEffect, useContext} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {getLocales} from 'react-native-localize';

import WhiteButtonV2 from '../../components/ButtonsV2/WhiteButtonV2';
import WhiteClearButtonV2 from '../../components/ButtonsV2/WhiteClearButtonV2';
import {useFixedBottomStyle} from '../../components/ButtonsV2/fixedBottomStyle';
import TranslateText from '../../components/TranslateText';
import {useAppDispatch} from '../../store/hooks';
import {
  detectCurrencyCode,
  setExplorer,
  setLanguage,
} from '../../reducers/settings';
import {genSeed, getNeutrinoCache} from '../../reducers/onboarding';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Initial: undefined;
  Pin: undefined;
  Recover: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Initial'>;
}

const Initial = (props: Props) => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const fixedBottomStyle = useFixedBottomStyle();

  useEffect(() => {
    dispatch(detectCurrencyCode());
    dispatch(setExplorer('Litecoin Space'));
    dispatch(
      setLanguage(getLocales()[0].languageCode, getLocales()[0].languageTag),
    );
  }, [dispatch]);

  // fetch neutrino cache!
  useEffect(() => {
    dispatch(getNeutrinoCache());
  }, [dispatch]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/big-nexus-logo.png')} />
        <View style={styles.textContainer}>
          <Image source={require('../../assets/images/nexus-text-logo.png')} />
          <TranslateText
            textKey="for_litecoin"
            domain="onboarding"
            textStyle={styles.logoText}
          />
        </View>
      </View>
      <View style={[fixedBottomStyle, styles.btnsContainer]}>
        <WhiteButtonV2
          textKey="create_wallet"
          textDomain="onboarding"
          onPress={() => {
            dispatch(genSeed());
            navigation.navigate('Pin');
          }}
        />
        <WhiteClearButtonV2
          textKey="already_wallet"
          textDomain="onboarding"
          onPress={() => {
            navigation.navigate('Recover');
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
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      gap: 30,
      marginBottom: screenHeight * 0.06,
    },
    logoText: {
      opacity: 0.6,
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
    },
    textContainer: {
      alignItems: 'center',
    },
    btnsContainer: {
      gap: screenHeight * 0.015,
    },
  });

Initial.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default Initial;
