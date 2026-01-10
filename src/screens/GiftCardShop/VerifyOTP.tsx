import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {verifyOtpCode, loginToNexusShop} from '../../reducers/nexusshopaccount';
import {unsetDeeplink} from '../../reducers/deeplinks';
import {
  colors,
  getSpacing,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const account = useAppSelector(
    (state: any) => state.nexusshopaccount.account,
  );
  const [loading, setLoading] = useState(false);
  const {uniqueId} = useAppSelector((state: any) => state.onboarding);

  const validateOtpCode = useCallback((code: string): boolean => {
    return code.length === 6 && /^\d+$/.test(code);
  }, []);

  // Navigate if user is already logged in
  useEffect(() => {
    if (account?.isLoggedIn) {
      navigation.navigate('NewWalletStack', {
        screen: 'Main',
        params: {activeCard: 3},
      });
    }
  }, [account?.isLoggedIn, navigation]);

  // Abort any pending request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle OTP code from navigation params (from deeplink)
  useEffect(() => {
    if (route?.params?.otpCode) {
      const handleParamsOTP = async (code: string) => {
        if (!account?.email || !uniqueId) {
          Alert.alert(
            'Error',
            'Missing account information. Please sign up first.',
          );
          return;
        }

        // Abort any previous request
        abortControllerRef.current?.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
          await dispatch(
            verifyOtpCode(
              account.email,
              uniqueId,
              code,
              abortController.signal,
            ),
          );
          // NOTE: after verifyOtpCode navigation is handled by the useEffect that watches account?.isLoggedIn
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
    }
  }, [
    route?.params?.otpCode,
    account?.email,
    uniqueId,
    dispatch,
    validateOtpCode,
  ]);

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

      // Abort any previous request
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await dispatch(
          verifyOtpCode(account.email, uniqueId, code, abortController.signal),
        );
        // Navigation is handled by the useEffect that watches account?.isLoggedIn
      } catch (errorCatch) {
        setOtpError(
          errorCatch instanceof Error
            ? errorCatch.message
            : 'Verification failed. Please try again.',
        );
      }
    },
    [otpCode, validateOtpCode, account?.email, uniqueId, dispatch],
  );

  const handleSendOTP = useCallback(async () => {
    if (!account?.email || !uniqueId) {
      Alert.alert(
        'Error',
        'Missing account information. Please sign up first.',
      );
      return;
    }

    try {
      await dispatch(loginToNexusShop(account.email));
    } catch (errorCatch) {
      setOtpError(
        errorCatch instanceof Error
          ? errorCatch.message
          : 'Sending failed. Please try again.',
      );
    }
  }, [account?.email, uniqueId, dispatch]);

  const isButtonDisabled = loading || !validateOtpCode(otpCode);

  const submitButton = useMemo(
    () => (
      <TouchableOpacity
        style={[
          commonStyles.buttonRounded,
          isButtonDisabled ? commonStyles.buttonDisabled : null,
        ]}
        onPress={async () => {
          await handleVerifyOTP();
        }}
        disabled={isButtonDisabled}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <TranslateText
            textKey="verify_code"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={commonStyles.buttonText}
            numberOfLines={1}
          />
        )}
      </TouchableOpacity>
    ),
    [SCREEN_HEIGHT, commonStyles, isButtonDisabled, loading, handleVerifyOTP],
  );

  const secondaryButton = useMemo(
    () => (
      <TouchableOpacity
        style={[
          commonStyles.buttonRoundedSecondary,
          loading ? commonStyles.buttonDisabled : null,
        ]}
        onPress={async () => {
          await handleSendOTP();
        }}
        disabled={loading}>
        <TranslateText
          textKey="resend_code"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={commonStyles.buttonTextBlack}
          numberOfLines={1}
        />
      </TouchableOpacity>
    ),
    [SCREEN_HEIGHT, commonStyles, loading, handleSendOTP],
  );

  return (
    <View style={styles.container}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
        <TranslateText
          textKey="check_email"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[commonStyles.title, styles.title]}
          numberOfLines={1}
        />
        <TranslateText
          textKey="we_sent_code_to"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[commonStyles.subtitle, styles.subtitle]}
          numberOfLines={2}
          interpolationObj={{email: account?.email || 'your email'}}
        />
        <TranslateText
          textKey="pls_check_email"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[commonStyles.subtitle, styles.subtitle]}
          numberOfLines={2}
        />
        <TranslateText
          textValue={otpError}
          maxSizeInPixels={SCREEN_HEIGHT * 0.017}
          textStyle={[commonStyles.errorText, styles.errorText]}
          numberOfLines={2}
        />
      </CustomSafeAreaView>
      <NumpadInput
        submitButton={submitButton}
        currentCode={otpCode}
        onChange={handleOtpChange}
        titleKey="enter_your_code"
        titleDomain="nexusShop"
        dotDisabled
        small
        secondaryButton={secondaryButton}
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
      textAlign: 'center',
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

const HeaderTitle: React.FC = React.memo(() => {
  const {height} = useContext(ScreenSizeContext);
  const styles = getStyles(0, height);
  return (
    <TranslateText
      textKey="verify"
      domain="nexusShop"
      maxSizeInPixels={height * 0.02}
      textStyle={styles.headerTitle}
      numberOfLines={1}
    />
  );
});

export const VerifyOTPNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  return {
    headerTransparent: true,
    headerTitle: () => <HeaderTitle />,
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
