import React, {useState, useEffect, useLayoutEffect, useContext} from 'react';
import {View, Text, StyleSheet, Alert, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import OnboardingHeader from '../../components/OnboardingHeader';
import WhiteButton from '../../components/Buttons/WhiteButton';
import WhiteClearButton from '../../components/Buttons/WhiteClearButton';
import TranslateText from '../../components/TranslateText';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {getBIP39Word} from '../../lib/utils/bip39';
import {useAppSelector} from '../../store/hooks';
import randomShuffle from '../../lib/utils/randomShuffle';
import {useAppDispatch} from '../../store/hooks';
import {setSeedVerified} from '../../reducers/onboarding';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Verify: undefined;
  Biometric: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Verify'>;
}

const Verify: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const seed = useAppSelector(state => state.onboarding.generatedSeed);
  const [multiplier, setMultiplier] = useState(1);
  const [selected, setSelectedIndex] = useState<number | null>(null);

  const [scrambled, setScrambledArray] = useState([]);

  useLayoutEffect(() => {
    const handleBackNavigation = () => {
      navigation.goBack();
    };

    navigation.setOptions({
      headerTransparent: true,
      headerTitleAlign: 'left',
      headerTintColor: 'white',
      headerLeft: () => (
        <HeaderButton
          onPress={() => handleBackNavigation()}
          imageSource={require('../../assets/images/back-icon.png')}
        />
      ),
      headerTitle: () => (
        <TranslateText
          textKey="verify_seed"
          domain="onboarding"
          textStyle={styles.headerTitle}
        />
      ),
    });
  }, [navigation]);

  const handlePress = async () => {
    if (multiplier === 8) {
      navigation.navigate('Biometric');
      dispatch(setSeedVerified(true));
      return;
    }
    setMultiplier(multiplier + 1);
    setSelectedIndex(null);
  };

  const handleSelection = async (word: string, index: number) => {
    if (word === seed[3 * multiplier - 2]) {
      setSelectedIndex(index);
    } else {
      setSelectedIndex(null);
      Alert.alert('Incorrect!');
    }
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#1162E6', '#0F55C7']}
        style={[
          styles.gradientContainer,
          Platform.OS === 'android'
            ? {paddingTop: insets.top, marginBottom: insets.bottom}
            : null,
        ]}>
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
          <WhiteClearButton
            value={scrambled[4 * multiplier - 4]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 4], 0)}
            selected={selected === 0 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 3]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 3], 1)}
            selected={selected === 1 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 2]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 2], 2)}
            selected={selected === 2 ? true : false}
          />
          <WhiteClearButton
            value={scrambled[4 * multiplier - 1]}
            onPress={() => handleSelection(scrambled[4 * multiplier - 1], 3)}
            selected={selected === 3 ? true : false}
          />
        </View>

        <View style={styles.bottomContainer}>
          <WhiteButton
            disabled={selected === null ? true : false}
            textKey="continue"
            textDomain="onboarding"
            onPress={() => handlePress()}
            small={false}
            active={true}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: 'white',
      fontSize: screenHeight * 0.026,
    },
    container: {
      flex: 1,
    },
    gradientContainer: {
      flex: 1,
    },
    optionsContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: screenWidth * 0.1,
      paddingVertical: screenHeight * 0.1,
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
    bottomContainer: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 30,
      paddingBottom: 50,
    },
    buttonContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 30,
      paddingBottom: 30,
    },
  });

export default Verify;
