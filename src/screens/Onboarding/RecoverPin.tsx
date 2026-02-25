import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';

import Auth from '../../components/Auth';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';
import {addPincode} from '../../reducers/authentication';
import {
  resetPincode,
  resetSeed,
  addUpRecoverPinFail,
} from '../../reducers/authentication';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getItem} from '../../utils/keychain';
import {resetToLoading} from '../../navigation/NavigationService';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  RecoverPin: undefined;
  Generate: undefined;
  Biometric: undefined;
  Welcome: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'RecoverPin'>;
}

const RecoverPin: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {biometricsAvailable, failedRecoverPinAttempts} = useAppSelector(
    state => state.authentication,
  );

  const headerTitleMemo = useMemo(
    () => (
      <TranslateText
        textKey={'recover_pin'}
        domain="onboarding"
        textStyle={styles.headerTitle}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
      />
    ),
    [styles.headerTitle, SCREEN_HEIGHT],
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

  const [keychainPincodeState, setKeychainPincodeState] = useState<
    string | null
  >('');

  useLayoutEffect(() => {
    const setKeychainPincode = async () => {
      const keychainPincode = await getItem('PINCODE');
      setKeychainPincodeState(keychainPincode);
    };
    setKeychainPincode();
  }, []);

  const pin = useAppSelector(state => state.authpad.pin);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerTitle: () => headerTitleMemo,
      headerLeft: () => headerLeftMemo,
      headerLeftContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
      headerRightContainerStyle:
        Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
    });
  }, [navigation, headerTitleMemo, headerLeftMemo, SCREEN_WIDTH]);

  const handleValidationSuccess = () => {
    dispatch(addPincode(pin));
    handleNavigation();
  };

  const handleValidationFailure = () => {
    dispatch(addUpRecoverPinFail());
  };

  useEffect(() => {
    // erase seed and pin from keychain on third fail
    if (failedRecoverPinAttempts > 2) {
      dispatch(resetPincode());
      dispatch(resetSeed());
      resetToLoading();
    }
  }, [failedRecoverPinAttempts, dispatch]);

  const handleNavigation = () => {
    if (biometricsAvailable) {
      navigation.navigate('Biometric');
    } else {
      navigation.navigate('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      <Auth
        handleValidationSuccess={handleValidationSuccess}
        handleValidationFailure={handleValidationFailure}
        keychainPincodeState={keychainPincodeState}
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

export default RecoverPin;
