import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {View, StyleSheet, Alert, Platform, AppState} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {verifyOtpCode, loginToNexusShop} from '../../reducers/nexusshopaccount';
import {unsetDeeplink} from '../../reducers/deeplinks';
import NumpadInput from '../../components/Numpad/NumpadInput';
import BlueButtonV2 from '../../components/ButtonsV2/BlueButtonV2';
import TimerGrayButtonV2 from '../../components/ButtonsV2/TimerGrayButtonV2';
import WarningModal from '../../components/Modals/WarningModal';
import InvisibleTurnstile, {
  InvisibleTurnstileRef,
} from '../../components/InvisibleTurnstile';
import {getSpacing, getCommonStyles} from '../../components/GiftCardShop/theme';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import ScreenHeader, {
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {getHeaderRowHeight} from '../../components/useHeaderHeight';
import {ScreenSizeContext} from '../../context/screenSize';

const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyOTPProps {
  route?: {
    params?: {
      otpCode?: string;
      returnTo?: boolean;
    };
  };
}

const VerifyOTP: React.FC<VerifyOTPProps> = ({route}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();

  const [otpCode, setOtpCode] = useState('');
  const resendUnlocksAtRef = useRef<number>(
    Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
  );
  const [resendCountdown, setResendCountdown] = useState(
    RESEND_COOLDOWN_SECONDS,
  );
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showMaxAttemptsModal, setShowMaxAttemptsModal] = useState(false);
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnstileRef = useRef<InvisibleTurnstileRef>(null);

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
      if (route?.params?.returnTo) {
        // Pop back through VerifyOTP → SignUp to the screen that initiated sign-up
        navigation.pop(2);
      } else {
        // popTo, not navigate: in React Navigation 7 navigate() pushes a new
        // Main on top of NexusShopStack instead of unwinding to it, which
        // leaves SignUp/VerifyOTP behind the shop in the back stack.
        // The action bubbles up to NewWalletStack, which owns 'Main'.
        navigation.popTo('Main', {screen: 'NexusShop'});
      }
    }
  }, [account?.isLoggedIn, navigation, route?.params?.returnTo]);

  // Abort any pending request on unmount and clear countdown timer
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Start/restart the cooldown timer using wall-clock time so
  // backgrounding the app doesn't freeze the countdown.
  const startCooldownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    resendUnlocksAtRef.current = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    setResendCountdown(RESEND_COOLDOWN_SECONDS);

    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((resendUnlocksAtRef.current - Date.now()) / 1000),
      );
      setResendCountdown(remaining);
      if (remaining <= 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }, 1000);
  }, []);

  // Start cooldown on mount (an OTP was just sent to reach this screen)
  useEffect(() => {
    startCooldownTimer();
  }, [startCooldownTimer]);

  // Recalculate countdown immediately when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && resendUnlocksAtRef.current > 0) {
        const remaining = Math.max(
          0,
          Math.ceil((resendUnlocksAtRef.current - Date.now()) / 1000),
        );
        setResendCountdown(remaining);
      }
    });
    return () => subscription.remove();
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
    }
  };

  const handlePaste = useCallback(async () => {
    const clipboardContent = await Clipboard.getString();
    const numericContent = clipboardContent.replace(/[^0-9]/g, '');
    if (numericContent.length > 0 && numericContent.length <= 6) {
      setOtpCode(numericContent);
    }
  }, []);

  const handleVerifyOTP = useCallback(
    async (codeToVerify?: string) => {
      const code = codeToVerify || otpCode;

      if (!validateOtpCode(code)) {
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
        // Reset failed attempts on success
        setFailedAttempts(0);
        // Navigation is handled by the useEffect that watches account?.isLoggedIn
      } catch {
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        // Clear the OTP input
        setOtpCode('');

        // Show modal after 3 failed attempts
        if (newFailedAttempts >= 3) {
          setShowMaxAttemptsModal(true);
        }
        // Error is also handled by warning modal in the reducer
      }
    },
    [
      otpCode,
      validateOtpCode,
      account?.email,
      uniqueId,
      dispatch,
      failedAttempts,
    ],
  );

  const handleSendOTP = useCallback(async () => {
    if (!account?.email || !uniqueId) {
      Alert.alert(
        'Error',
        'Missing account information. Please sign up first.',
      );
      return;
    }

    if (isResending) return;
    setIsResending(true);

    try {
      const turnstileToken = await turnstileRef.current?.execute();
      if (!turnstileToken) {
        setResendError('Verification failed. Please try again.');
        return;
      }
      await dispatch(loginToNexusShop(account.email, turnstileToken));
      startCooldownTimer();
      setFailedAttempts(0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to resend code.';
      setResendError(message);
    } finally {
      setIsResending(false);
    }
  }, [account?.email, uniqueId, dispatch, startCooldownTimer, isResending]);

  const handleCloseResendError = useCallback(() => {
    setResendError('');
  }, []);

  const handleCloseMaxAttemptsModal = useCallback(() => {
    setShowMaxAttemptsModal(false);
  }, []);

  const isButtonDisabled =
    loading || !validateOtpCode(otpCode) || failedAttempts >= 3;

  const submitButton = useMemo(
    () => (
      <BlueButtonV2
        textKey="verify_code"
        textDomain="nexusShop"
        onPress={() => handleVerifyOTP()}
        disabled={isButtonDisabled}
        loading={loading}
      />
    ),
    [isButtonDisabled, loading, handleVerifyOTP],
  );

  const secondaryButton = useMemo(
    () => (
      <TimerGrayButtonV2
        textKey="resend_code"
        textDomain="nexusShop"
        onPress={handleSendOTP}
        seconds={resendCountdown}
        totalSeconds={RESEND_COOLDOWN_SECONDS}
        disabled={loading || isResending}
      />
    ),
    [loading, isResending, handleSendOTP, resendCountdown],
  );

  return (
    <View style={styles.container}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['top']}>
        <TranslateText
          textKey="check_email"
          domain="nexusShop"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={[commonStyles.subtitle, styles.title]}
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
      </CustomSafeAreaView>
      <NumpadInput
        submitButton={submitButton}
        currentCode={otpCode}
        onChange={handleOtpChange}
        onPaste={handlePaste}
        titleKey="enter_your_code"
        titleDomain="nexusShop"
        dotDisabled
        small={Platform.OS === 'ios' ? true : false}
        extraSmall={Platform.OS === 'ios' ? false : true}
        secondaryButton={secondaryButton}
      />
      <WarningModal
        isVisible={showMaxAttemptsModal}
        close={handleCloseMaxAttemptsModal}
        text="Too many incorrect attempts. To get a new code, press Resend Code."
      />
      <WarningModal
        isVisible={!!resendError}
        close={handleCloseResendError}
        text={resendError}
      />
      <InvisibleTurnstile ref={turnstileRef} action="send-otp" />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="verify"
        titleDomain="nexusShop"
        fadeStyle={headerFadeStyle}
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
      fontWeight: '700',
      paddingTop: getHeaderRowHeight(screenWidth, screenHeight),
    },
    subtitle: {
      paddingTop: getSpacing(screenWidth, screenHeight).xs,
    },
  });

export default VerifyOTP;
