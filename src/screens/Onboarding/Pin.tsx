import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

import OnboardingAuthPad from '../../components/Numpad/OnboardingAuthPad';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';
import {addPincode} from '../../reducers/authentication';
import {clearValues} from '../../reducers/authpad';
import {resetPincode} from '../../reducers/authentication';
import {resetSeedAction} from '../../reducers/onboarding';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Pin: undefined;
  Generate: undefined;
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Pin'>;
}

const Pin: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const {t} = useTranslation('onboarding');

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeInitialSet, setPasscodeInitialSet] = useState(false);
  const {pin} = useAppSelector(state => state.authpad!);
  const {beingRecovered} = useAppSelector(state => state.onboarding!);
  const {biometricsAvailable} = useAppSelector(state => state.authentication!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      dispatch(resetPincode());
      if (beingRecovered) {
        dispatch(resetSeedAction());
      }
    });

    return unsubscribe;
  }, [navigation, dispatch, beingRecovered]);

  const headerLeftMemo = useMemo(
    () => (
      <HeaderButton
        onPress={() => {
          navigation.goBack();
        }}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    [navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => headerLeftMemo,
    });
  }, [navigation, headerLeftMemo]);

  const headerTitleMemo = useMemo(
    () => (
      <TranslateText
        textKey={passcodeInitialSet ? 'verify_pin' : 'create_pin'}
        domain="onboarding"
        textStyle={styles.headerTitle}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
      />
    ),
    [passcodeInitialSet, styles.headerTitle, SCREEN_HEIGHT],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerTitle: () => headerTitleMemo,
    });
  }, [navigation, headerTitleMemo]);

  const handleCompletion = () => {
    setNewPasscode(pin);
    setPasscodeInitialSet(true);
    dispatch(clearValues());
  };

  const handleValidationSuccess = () => {
    dispatch(addPincode(newPasscode));
    handleNavigation();
  };

  const handleValidationFailure = () => {
    dispatch(resetPincode());
    navigation.pop(1);
  };

  const handleNavigation = () => {
    if (!beingRecovered) {
      navigation.navigate('Generate');
    } else {
      if (biometricsAvailable) {
        navigation.navigate('Biometric');
      } else {
        navigation.navigate('Welcome');
      }
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingAuthPad
        headerDescriptionText={
          passcodeInitialSet
            ? t('create_pin_repeat')
            : t('create_pin_description')
        }
        handleCompletion={handleCompletion}
        handleValidationFailure={handleValidationFailure}
        handleValidationSuccess={handleValidationSuccess}
        newPasscode={newPasscode}
        passcodeInitialSet={passcodeInitialSet}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    // left absolute margin is screenWidth * 0.15
    // used for subtitles alinging
    headerTitle: {
      position: 'absolute',
      top: screenHeight * 0.014 * -1,
      left: screenWidth * 0.5 * -1 + screenWidth * 0.15,
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.026,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  });

export default Pin;
