import React, {useState, useEffect, useContext, useMemo} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
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
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      // Only reset if going back, not when navigating forward
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        dispatch(resetPincode());
        if (beingRecovered) {
          dispatch(resetSeedAction());
        }
      }
    });

    return unsubscribe;
  }, [navigation, dispatch, beingRecovered]);

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

  const headerLeftMemo = useMemo(
    () => (
      <HeaderButton
        onPress={() => {
          navigation.goBack();
        }}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    [navigation],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitleContainerStyle: {
        left: 7,
      },
      headerTitle: () => headerTitleMemo,
      headerLeft: () => headerLeftMemo,
      headerLeftContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
      headerRightContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
    });
  }, [navigation, headerTitleMemo, headerLeftMemo, SCREEN_WIDTH]);

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
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: 'bold',
      color: 'white',
      fontSize: screenHeight * 0.026,
    },
  });

export default Pin;
