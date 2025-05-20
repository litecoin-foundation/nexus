import React, {useEffect, useContext} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {getLocales} from 'react-native-localize';

import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import {useAppDispatch} from '../../store/hooks';
import {
  detectCurrencyCode,
  setExplorer,
  setLanguage,
} from '../../reducers/settings';
import {
  genSeed,
  getNeutrinoCache,
  setSeedRecovery,
} from '../../reducers/onboarding';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  InitialWithSeed: {
    existingSeed: string;
  };
  Pin: undefined;
  Recover:
    | {
        existingSeed?: string;
      }
    | undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'InitialWithSeed'>;
  route: RouteProp<RootStackParamList, 'InitialWithSeed'>;
}

const InitialWithSeed = (props: Props) => {
  const {navigation, route} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

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

  const loginWithExistingSeed = async (seedString: string) => {
    const seed = seedString.split(',');
    await dispatch(setSeedRecovery(seed));
    navigation.navigate('Pin');
  };

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <View style={styles.topContainer}>
        <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/big-nexus-logo.png')} />
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/images/nexus-text-logo.png')}
              />
              <TranslateText
                textKey="for_litecoin"
                domain="onboarding"
                textStyle={styles.logoText}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                numberOfLines={1}
              />
            </View>
          </View>
          <TranslateText
            textKey="existing_seed_note"
            domain="onboarding"
            textStyle={styles.descText}
            maxLengthInPixels={SCREEN_WIDTH}
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            numberOfLines={4}
          />
        </CustomSafeAreaView>
      </View>

      <View style={styles.bottomContainer}>
        <CustomSafeAreaView
          styles={{...styles.safeArea, ...styles.btnsContainer}}
          edges={['bottom']}>
          <WhiteButton
            textKey="create_new_wallet"
            textDomain="onboarding"
            small={false}
            onPress={() => {
              dispatch(genSeed());
              navigation.navigate('Pin');
            }}
            active={true}
          />
          <WhiteClearButton
            textKey="proceed_with_existing"
            textDomain="onboarding"
            small={false}
            onPress={() => {
              loginWithExistingSeed(route.params.existingSeed);
            }}
          />
          <WhiteClearButton
            textKey="already_wallet"
            textDomain="onboarding"
            small={false}
            onPress={() => {
              navigation.navigate('Recover');
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
      flex: 1,
      alignItems: 'center',
    },
    topContainer: {
      flexBasis: '60%',
      paddingTop: screenHeight * 0.07,
    },
    logoContainer: {
      alignItems: 'center',
      gap: screenHeight * 0.02,
    },
    imageContainer: {
      alignItems: 'center',
    },
    logoText: {
      opacity: 0.6,
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontWeight: '700',
    },
    descText: {
      width: screenWidth * 0.8,
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.018,
      fontWeight: '700',
      textAlign: 'center',
      paddingTop: screenHeight * 0.02,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.02,
      width: '100%',
      paddingHorizontal: 30,
    },
    btnsContainer: {
      width: '100%',
      gap: screenHeight * 0.015,
    },
    safeArea: {},
  });

InitialWithSeed.navigationOptions = {
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerShown: false,
};

export default InitialWithSeed;
