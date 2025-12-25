import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  verifyOtpCode,
  verifyOtpCodeTest,
} from '../../reducers/nexusshopaccount';
import {unsetDeeplink} from '../../reducers/deeplinks';
import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import OTPVerified from './OTPVerified';

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
        if (__DEV__) {
          await dispatch(verifyOtpCodeTest(account.email, uniqueId, code));
        } else {
          await dispatch(verifyOtpCode(account.email, uniqueId, code));
        }

        if (!error) {
          setShowVerified(true);
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
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
  ]);

  // Check if user is already logged in
  useEffect(() => {
    if (account?.isLoggedIn) {
      setShowVerified(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  }, [account?.isLoggedIn, navigation]);

  const validateOtpCode = (code: string): boolean => {
    return code.length === 6 && /^\d+$/.test(code);
  };

  const handleOtpChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtpCode(numericText);
      if (otpError) setOtpError('');
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
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
      if (__DEV__) {
        // await dispatch(verifyOtpCodeTest(account.email, uniqueId, code));
        await dispatch(verifyOtpCode(account.email, uniqueId, code));
      } else {
        await dispatch(verifyOtpCode(account.email, uniqueId, code));
      }

      if (!error) {
        setShowVerified(true);
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch {
      Alert.alert('Verification Failed', 'Please try again later.');
    }
  };

  if (showVerified) {
    return <OTPVerified />;
  }

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Text style={commonStyles.title}>Verify Your Email</Text>
      <Text style={[commonStyles.body, styles.subtitle]}>
        Enter the 6-digit code sent to {account?.email || 'your email'}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={commonStyles.label}>Verification Code</Text>
        <TextInput
          style={[
            commonStyles.input,
            styles.otpInput,
            otpError ? styles.inputError : null,
          ]}
          value={otpCode}
          onChangeText={handleOtpChange}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={6}
          autoFocus={true}
          editable={!loginLoading}
        />
        {otpError ? (
          <Text style={commonStyles.errorText}>{otpError}</Text>
        ) : null}
      </View>

      {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          commonStyles.button,
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
    </View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      padding: getSpacing(screenHeight).lg,
      justifyContent: 'center',
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: getSpacing(screenHeight).xl,
      color: colors.textSecondary,
    },
    inputContainer: {
      marginBottom: getSpacing(screenHeight).lg,
    },
    otpInput: {
      textAlign: 'center',
      fontSize: getFontSize(screenHeight).xl,
      letterSpacing: 8,
      fontFamily: 'monospace',
    },
    inputError: {
      borderColor: colors.danger,
    },
  });

export const VerifyOTPNavigationOptions = (
  navigation: any,
): StackNavigationOptions => ({
  title: 'Verify Email',
  headerStyle: {
    backgroundColor: '#007AFF',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '700' as const,
  },
});

export default VerifyOTP;
