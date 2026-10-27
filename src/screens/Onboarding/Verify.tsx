import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import OnboardingHeader from '../../components/OnboardingHeader';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {BUTTON_HEIGHT_RATIO} from '../../components/ButtonsV2/BlueButtonV2';
import WhiteButtonV2 from '../../components/ButtonsV2/WhiteButtonV2';
import WhiteClearButtonV2 from '../../components/ButtonsV2/WhiteClearButtonV2';
import {
  GAP_RATIO,
  useFixedBottomStyle,
} from '../../components/ButtonsV2/fixedBottomStyle';

import {getBIP39Word} from '../../utils/bip39';
import {useAppSelector} from '../../store/hooks';
import randomShuffle from '../../utils/randomShuffle';
import {useAppDispatch} from '../../store/hooks';
import {setSeedVerified} from '../../reducers/onboarding';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Verify: undefined;
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Verify'>;
}

const Verify: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const fixedBottomStyle = useFixedBottomStyle();

  const seed = useAppSelector(state => state.onboarding.generatedSeed);
  const {biometricsAvailable} = useAppSelector(state => state.authentication);
  const [multiplier, setMultiplier] = useState(1);
  const [selected, setSelectedIndex] = useState<number | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const MAX_WRONG_GUESSES = 2;

  const [scrambled, setScrambledArray] = useState<string[]>([]);

  const handlePress = async () => {
    if (multiplier === 8) {
      if (biometricsAvailable) {
        navigation.navigate('Biometric');
      } else {
        navigation.navigate('Welcome');
      }
      dispatch(setSeedVerified(true));
      return;
    }
    setMultiplier(multiplier + 1);
    setSelectedIndex(null);
    setWrongGuesses(0);
  };

  const handleSelection = async (word: string, index: number) => {
    if (word === seed[3 * multiplier - 2]) {
      setSelectedIndex(index);
      return;
    }

    setSelectedIndex(null);

    const nextWrongGuesses = wrongGuesses + 1;
    if (nextWrongGuesses > MAX_WRONG_GUESSES) {
      Alert.alert(t('verify_failed_title'), t('verify_failed_description'), [
        {text: t('ok'), onPress: () => navigation.goBack()},
      ]);
      return;
    }

    setWrongGuesses(nextWrongGuesses);
    Alert.alert(t('incorrect'));
  };

  useEffect(() => {
    for (let i = 1; i < 9; i++) {
      const challengeArray = randomShuffle([
        seed[3 * i - 2],
        getBIP39Word(),
        getBIP39Word(),
        getBIP39Word(),
      ]);

      setScrambledArray(arrayItems => [...arrayItems, ...challengeArray]);
    }
  }, [seed]);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.gradient}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
        <OnboardingHeader
          textKey="verify_seed_description"
          textDomain="onboarding"
          textInterpolation={{position: `${3 * multiplier - 1}`}}>
          <View style={styles.optionsContainer}>
            <View style={styles.optionSubContainer}>
              <Text style={styles.optionText}>{seed[3 * multiplier - 3]}</Text>
              <Text style={styles.optionValueText}>#{3 * multiplier - 2}</Text>
            </View>
            <View style={styles.optionSubContainer}>
              <View style={styles.optionBox} />
              <Text style={styles.optionValueTextActual}>
                #{3 * multiplier - 1}
              </Text>
            </View>
            <View style={styles.optionSubContainer}>
              <Text style={styles.optionText}>{seed[3 * multiplier - 1]}</Text>
              <Text style={styles.optionValueText}>#{3 * multiplier}</Text>
            </View>
          </View>
        </OnboardingHeader>

        <View style={styles.buttonContainer}>
          <WhiteClearButtonV2
            textValue={scrambled[4 * multiplier - 4]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 4], 0)}
            selected={selected === 0}
          />
          <WhiteClearButtonV2
            textValue={scrambled[4 * multiplier - 3]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 3], 1)}
            selected={selected === 1}
          />
          <WhiteClearButtonV2
            textValue={scrambled[4 * multiplier - 2]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 2], 2)}
            selected={selected === 2}
          />
          <WhiteClearButtonV2
            textValue={scrambled[4 * multiplier - 1]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 1], 3)}
            selected={selected === 3}
          />
        </View>
      </CustomSafeAreaView>

      <View style={fixedBottomStyle}>
        <WhiteButtonV2
          disabled={selected === null}
          textKey="continue"
          textDomain="onboarding"
          onPress={() => handlePress()}
        />
      </View>

      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="verify_seed"
        titleDomain="onboarding"
        fadeStyle={headerFadeStyle}
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    optionsContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: screenWidth * 0.1,
      paddingVertical: screenHeight * 0.13,
    },
    optionSubContainer: {
      height: screenHeight * 0.08,
      flexDirection: 'column',
      alignItems: 'center',
    },
    optionBox: {
      height: screenHeight * 0.035,
      width: screenWidth * 0.22,
      backgroundColor: 'white',
      borderRadius: screenHeight * 0.01,
      marginBottom: screenHeight * 0.01,
    },
    optionText: {
      height: screenHeight * 0.035,
      color: 'white',
      fontSize: screenHeight * 0.02,
      paddingTop: screenHeight * 0.006,
      marginBottom: screenHeight * 0.01,
    },
    optionValueText: {
      color: 'white',
      opacity: 0.2,
      fontSize: screenHeight * 0.02,
    },
    optionValueTextActual: {
      color: 'white',
      opacity: 0.8,
      fontSize: screenHeight * 0.02,
    },
    buttonContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * GAP_RATIO,
      paddingBottom:
        screenHeight * BUTTON_HEIGHT_RATIO + screenWidth * GAP_RATIO * 2,
    },
  });

export default Verify;
