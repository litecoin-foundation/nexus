import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {verifyOtpCode} from '../../reducers/nexusshopaccount';
import {unsetDeeplink} from '../../reducers/deeplinks';
import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import OTPVerified from './OTPVerified';
import NumpadInput from '../../components/Numpad/NumpadInput';
import HeaderButton from '../../components/Buttons/HeaderButton';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface VerifyOTPProps {
  route?: {
    params?: {
      otpCode?: string;
    };
  };
}

const VerifyOTP: React.FC<VerifyOTPProps> = ({route}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showVerified, setShowVerified] = useState(false);

  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const {account, loginLoading, error} = useAppSelector(
    (state: any) => state.nexusshopaccount,
  );
  const {uniqueId} = useAppSelector((state: any) => state.onboarding);

  const validateOtpCode = useCallback((code: string): boolean => {
    return code.length === 6 && /^\d+$/.test(code);
  }, []);

  // Handle OTP code from navigation params (from deeplink)
  useEffect(() => {
    const handleParamsOTP = async (code: string) => {
      if (!account?.email || !uniqueId) {
        Alert.alert(
          'Error',
          'Missing account information. Please sign up first.',
        );
        return;
      }

      try {
        await dispatch(verifyOtpCode(account.email, uniqueId, code));

        if (!error) {
          setShowVerified(true);
        }
      } catch {
        Alert.alert('Verification Failed', 'Please try again later.');
      }
    };

    const otpCodeFromParams = route?.params?.otpCode;
    if (otpCodeFromParams && validateOtpCode(otpCodeFromParams)) {
      setOtpCode(otpCodeFromParams);
      handleParamsOTP(otpCodeFromParams);
    }

    dispatch(unsetDeeplink());
  }, [
    route?.params?.otpCode,
    account?.email,
    uniqueId,
    dispatch,
    error,
    navigation,
    validateOtpCode,
  ]);

  // Check if user is already logged in
  useEffect(() => {
    if (account?.isLoggedIn) {
      setShowVerified(true);
      // Hide header for verified screen
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [account?.isLoggedIn, navigation]);

  const handleOtpChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtpCode(numericText);
      if (otpError) setOtpError('');
    }
  };

  const handleVerifyOTP = useCallback(
    async (codeToVerify?: string) => {
      const code = codeToVerify || otpCode;

      if (!validateOtpCode(code)) {
        setOtpError('Please enter a valid 6-digit OTP code');
        return;
      }

      if (!account?.email || !uniqueId) {
        Alert.alert(
          'Error',
          'Missing account information. Please sign up first.',
        );
        return;
      }

      try {
        await dispatch(verifyOtpCode(account.email, uniqueId, code));

        if (!error) {
          setShowVerified(true);
        }
      } catch {
        Alert.alert('Verification Failed', 'Please try again later.');
      }
    },
    [otpCode, validateOtpCode, account?.email, uniqueId, dispatch, error],
  );

  const submitButton = useMemo(
    () => (
      <TouchableOpacity
        style={[
          commonStyles.buttonRounded,
          loginLoading ? commonStyles.buttonDisabled : null,
          !validateOtpCode(otpCode) ? commonStyles.buttonDisabled : null,
        ]}
        onPress={() => handleVerifyOTP()}
        disabled={loginLoading || !validateOtpCode(otpCode)}>
        {loginLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={commonStyles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>
    ),
    [commonStyles, handleVerifyOTP, validateOtpCode, loginLoading, otpCode],
  );

  if (showVerified) {
    return <OTPVerified />;
  }

  return (
    <View style={styles.container}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
        <Text style={[commonStyles.title, styles.title]}>Check your email</Text>
        <Text style={[commonStyles.subtitle, styles.subtitle]}>
          We've sent a one-time verification code to{' '}
          {account?.email || 'your email'}
        </Text>
        <Text style={[commonStyles.subtitle, styles.subtitle]}>
          Please check your inbox and enter the code to complete your
          registration
        </Text>
        <Text style={[commonStyles.errorText, styles.errorText]}>
          {otpError}
        </Text>

        {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
      </CustomSafeAreaView>
      <NumpadInput
        submitButton={submitButton}
        currentCode={otpCode}
        onChange={handleOtpChange}
        titleKey="enter_your_code"
        titleDomain="nexusShop"
        dotDisabled
        small
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: '#0070F0',
      paddingHorizontal: screenWidth * 0.05,
    },
    title: {
      paddingTop: getSpacing(screenHeight).header,
    },
    subtitle: {
      fontSize: getFontSize(screenHeight).lg,
      paddingTop: getSpacing(screenHeight).xs,
    },
    errorText: {
      paddingTop: getSpacing(screenHeight).xs,
    },
    inputError: {
      borderColor: colors.danger,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const VerifyOTPNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="verify"
        domain="nexusShop"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default VerifyOTP;
