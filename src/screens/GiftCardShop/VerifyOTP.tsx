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
  Platform,
  Text,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {verifyOtpCode, loginToNexusShop} from '../../reducers/nexusshopaccount';
import {unsetDeeplink} from '../../reducers/deeplinks';
import {
  colors,
  getSpacing,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import NumpadInput from '../../components/Numpad/NumpadInput';
import HeaderButton from '../../components/Buttons/HeaderButton';
import Svg, {Circle} from 'react-native-svg';

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

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  backgroundColor: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  backgroundColor,
}) => {
  // Add padding to prevent clipping
  const padding = strokeWidth;
  const viewBoxSize = size + padding * 2;
  const center = viewBoxSize / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      <Circle
        stroke={backgroundColor}
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
};

const VerifyOTP: React.FC<VerifyOTPProps> = ({route}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Abort any pending request on unmount and clear countdown timer
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [resendCountdown]);

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
        // Navigation is handled by the useEffect that watches account?.isLoggedIn
      } catch (errorCatch) {
        // Error is handled by warning modal
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
      // Start 60 second countdown
      setResendCountdown(60);
    } catch (errorCatch) {
      // Error is handled by warning modal
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

  const isResendDisabled = loading || resendCountdown > 0;

  const secondaryButton = useMemo(() => {
    // Progress should go from 100% (at 60s) to 0% (at 0s) - counting DOWN
    const progressPercentage =
      resendCountdown > 0 ? (resendCountdown / 60) * 100 : 0;

    return (
      <TouchableOpacity
        style={[
          commonStyles.buttonRoundedSecondary,
          isResendDisabled ? styles.buttonResendDisabled : null,
        ]}
        onPress={async () => {
          await handleSendOTP();
        }}
        disabled={isResendDisabled}>
        <View style={styles.resendButtonContent}>
          <TranslateText
            textKey="resend_code"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={[
              commonStyles.buttonTextBlack,
              isResendDisabled ? styles.resendTextDisabled : null,
            ]}
            numberOfLines={1}
          />
          {resendCountdown > 0 && (
            <View style={styles.countdownContainerAbsolute}>
              <CircularProgress
                size={SCREEN_HEIGHT * 0.035}
                strokeWidth={3}
                progress={progressPercentage}
                color="#0070F0"
                backgroundColor="rgba(0, 112, 240, 0.15)"
              />
              <Text style={styles.countdownText}>{resendCountdown}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [
    SCREEN_HEIGHT,
    commonStyles,
    isResendDisabled,
    handleSendOTP,
    resendCountdown,
    styles,
  ]);

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
      fontWeight: '700',
      paddingTop: getSpacing(screenWidth, screenHeight).header,
    },
    subtitle: {
      paddingTop: getSpacing(screenWidth, screenHeight).xs,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    buttonResendDisabled: {
      backgroundColor: 'rgba(242, 242, 247, 0.6)',
      borderColor: 'rgba(142, 142, 147, 0.2)',
    },
    resendTextDisabled: {
      color: 'rgba(51, 51, 51, 0.5)',
    },
    resendButtonContent: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    },
    countdownContainerAbsolute: {
      position: 'absolute',
      left: getSpacing(screenWidth, screenHeight).lg,
      justifyContent: 'center',
      alignItems: 'center',
      width: screenHeight * 0.045,
      height: screenHeight * 0.045,
      overflow: 'visible',
    },
    countdownText: {
      position: 'absolute',
      fontSize: screenHeight * 0.0135,
      fontWeight: '700',
      color: colors.primary,
    },
  });

const HeaderTitle: React.FC = React.memo(() => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);
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
  const {width} = useContext(ScreenSizeContext);

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
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginEnd: -5} : null,
  };
};

export default VerifyOTP;
