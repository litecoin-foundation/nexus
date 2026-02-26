import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {
  StackNavigationProp,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {NexusShopStackParamList} from '../../navigation/NexusShopStack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '../../store/hooks';
import {
  registerOnNexusShop,
  clearAccount,
  setAccountError,
} from '../../reducers/nexusshopaccount';
import {
  colors,
  getSpacing,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import HeaderButton from '../../components/Buttons/HeaderButton';
import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import Turnstile from '../../components/Turnstile';
import WarningModal from '../../components/Modals/WarningModal';

interface Props {}

const SignUp: React.FC<Props> = () => {
  const {t} = useTranslation('nexusShop');
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const shopUserEmail = account && account.email;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<StackNavigationProp<NexusShopStackParamList>>();

  const [email, setEmail] = useState(shopUserEmail || '');
  const [emailError, setEmailError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {loginLoading, error: reduxError} = useSelector(
    (state: any) => state.nexusshopaccount,
  );
  const {uniqueId} = useSelector((state: any) => state.onboarding);

  const validateEmail = (emailProp: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailProp);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  const handleTurnstileTokenReceived = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileExpired = () => {
    // Clear token and force new validation
    setTurnstileToken('');
    setTurnstileResetKey(prev => prev + 1);
    setErrorMessage(
      'Verification expired. Please complete the challenge again.',
    );
    setShowErrorModal(true);
  };

  const handleTurnstileError = () => {
    // Clear token and force new validation
    setTurnstileToken('');
    setTurnstileResetKey(prev => prev + 1);
    setErrorMessage('Verification failed. Please try again.');
    setShowErrorModal(true);
  };

  // Watch for Redux errors and display in modal
  useEffect(() => {
    if (reduxError) {
      setErrorMessage(reduxError);
      setShowErrorModal(true);
    }
  }, [reduxError]);

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
    // Clear Redux error when modal is closed
    if (reduxError) {
      dispatch(setAccountError(''));
    }
  };

  const translateEmailErrorForLocale = (text: string) => {
    switch (text) {
      case 'Email is required':
        setEmailError('email_address');
        break;
      case 'Please enter a valid email address is required':
        setEmailError('enter_valid_email');
        break;
      default:
        setEmailError(text);
        break;
    }
  };

  const handleSignUp = async () => {
    let hasErrors = false;

    if (!email.trim()) {
      translateEmailErrorForLocale('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      translateEmailErrorForLocale('Please enter a valid email address');
      hasErrors = true;
    }

    if (!uniqueId) {
      Alert.alert(
        'Error',
        'Unique ID not found. Please complete onboarding first.',
      );
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the verification challenge');
      setShowErrorModal(true);
      return;
    }

    if (hasErrors) return;

    try {
      await dispatch(
        registerOnNexusShop(email.trim(), uniqueId, turnstileToken),
      );
      navigation.navigate('VerifyOTP');
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Please try again later.';
      setErrorMessage(errMsg);
      setShowErrorModal(true);
      // Reset turnstile widget on verification failure
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('verification')
      ) {
        setTurnstileToken('');
        setTurnstileResetKey(prev => prev + 1);
      }
    }
  };

  const handleResetShopUser = () => {
    dispatch(clearAccount());
  };

  const insets = useSafeAreaInsets();
  const topTranslateY = useSharedValue(0);
  const bottomTranslateY = useSharedValue(0);
  const imageOpacity = useSharedValue(1);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      const keyboardHeight = e.endCoordinates.height;
      // Keyboard height includes the bottom safe area inset, so subtract it
      const fullShift = keyboardHeight - insets.bottom;
      bottomTranslateY.value = withTiming(-fullShift * 1.08, {duration: 250});
      // Blue section moves up less — just enough to close the gap
      topTranslateY.value = withTiming(-fullShift * 0.515, {duration: 250});
      imageOpacity.value = withTiming(0, {duration: 250});
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      topTranslateY.value = withTiming(0, {duration: 250});
      bottomTranslateY.value = withTiming(0, {duration: 250});
      imageOpacity.value = withTiming(1, {duration: 250});
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [
    SCREEN_HEIGHT,
    insets.bottom,
    topTranslateY,
    bottomTranslateY,
    imageOpacity,
  ]);

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{translateY: topTranslateY.value}],
  }));

  const animatedBottomStyle = useAnimatedStyle(() => ({
    transform: [{translateY: bottomTranslateY.value}],
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
        <Animated.View style={[styles.topContainer, animatedTopStyle]}>
          <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
            <Image
              style={styles.image}
              source={require('../../assets/images/shop-card.png')}
            />
          </Animated.View>

          <View style={styles.formContainer}>
            <View style={styles.titleContainer}>
              <TranslateText
                textKey="sign_up_for"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.028}
                textStyle={styles.title}
                numberOfLines={1}
              />
              <TranslateText
                textValue=" "
                maxSizeInPixels={SCREEN_HEIGHT * 0.028}
                textStyle={styles.title}
                numberOfLines={1}
              />
              <TranslateText
                textKey="nexus_shop"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.027}
                textStyle={styles.titleBold}
                numberOfLines={1}
              />
            </View>

            <View style={styles.inputContainer}>
              <TranslateText
                textKey="email_address"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.emailLabel}
                numberOfLines={1}
              />
              <TextInput
                style={[
                  commonStyles.input,
                  emailError ? styles.inputError : null,
                ]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder={t('enter_your_email')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loginLoading}
              />
              {emailError ? (
                <TranslateText
                  textKey={emailError}
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={commonStyles.errorText}
                  numberOfLines={2}
                />
              ) : null}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, animatedBottomStyle]}>
          <Turnstile
            onTokenReceived={handleTurnstileTokenReceived}
            onTokenExpired={handleTurnstileExpired}
            onError={handleTurnstileError}
            action="register"
            resetKey={turnstileResetKey}
          />

          <TouchableOpacity
            style={[
              commonStyles.buttonRounded,
              loginLoading ||
              !turnstileToken ||
              !email.trim() ||
              !validateEmail(email)
                ? commonStyles.buttonDisabled
                : null,
              styles.signUpButton,
            ]}
            onPress={handleSignUp}
            disabled={
              loginLoading ||
              !turnstileToken ||
              !email.trim() ||
              !validateEmail(email)
            }>
            {loginLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <TranslateText
                textKey="sign_up"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            )}
          </TouchableOpacity>

          {__DEV__ ? (
            <View style={styles.resetButtonContainer}>
              <TouchableOpacity
                style={commonStyles.buttonRounded}
                onPress={handleResetShopUser}>
                <TranslateText
                  textKey="reset_shop_user"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={commonStyles.buttonText}
                  numberOfLines={1}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <></>
          )}
        </Animated.View>
      </CustomSafeAreaView>
      <WarningModal
        isVisible={showErrorModal}
        close={handleCloseErrorModal}
        text={errorMessage}
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      overflow: 'hidden',
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.6,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: screenHeight * 0.04,
      borderBottomRightRadius: screenHeight * 0.04,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: screenHeight * 0.32,
      alignItems: 'center',
      zIndex: 1,
      marginTop: screenHeight * 0.08,
    },
    image: {
      width: '90%',
      height: '100%',
      objectFit: 'contain',
      opacity: 0.5,
    },
    formContainer: {
      width: '100%',
      paddingLeft: getSpacing(screenWidth, screenHeight).xl,
      paddingRight: getSpacing(screenWidth, screenHeight).xl,
      paddingBottom: getSpacing(screenWidth, screenHeight).xl,
      zIndex: 2,
    },
    titleContainer: {
      flexDirection: 'row',
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    title: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontWeight: '600',
      color: '#fff',
    },
    titleBold: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
      color: '#fff',
    },
    inputContainer: {},
    inputError: {
      borderWidth: 2,
      borderColor: colors.danger,
    },
    emailLabel: {
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      color: '#fff',
      textTransform: 'uppercase',
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: 0,
      width: '100%',
      paddingHorizontal: getSpacing(screenWidth, screenHeight).xl,
    },
    resetButtonContainer: {
      paddingTop: 10,
    },
    signUpButton: {
      marginTop: getSpacing(screenWidth, screenHeight).md,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const SignUpNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="sign_up"
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
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && width >= 414 ? {marginEnd: -5} : null,
  };
};

export default SignUp;
