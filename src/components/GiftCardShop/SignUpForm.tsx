import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '../../store/hooks';
import {
  loginToNexusShop,
  loginToNexusShopTest,
} from '../../reducers/nexusshopaccount';
import {colors, getSpacing, getCommonStyles} from './theme';
import PopUpModal from '../Modals/PopUpModal';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const SignUpForm: React.FC<Props> = () => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dispatch = useAppDispatch();
  const {loginLoading, error} = useSelector(
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

  const handleSignUp = async () => {
    let hasErrors = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!uniqueId) {
      Alert.alert(
        'Error',
        'Unique ID not found. Please complete onboarding first.',
      );
      return;
    }

    if (hasErrors) return;

    try {
      if (__DEV__) {
        dispatch(loginToNexusShopTest(email.trim(), uniqueId));
      } else {
        dispatch(loginToNexusShop(email.trim(), uniqueId));
      }
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Sign Up Failed', 'Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={commonStyles.title}>Sign Up for Nexus Shop</Text>

      <View style={styles.inputContainer}>
        <Text style={commonStyles.label}>Email Address</Text>
        <TextInput
          style={[commonStyles.input, emailError ? styles.inputError : null]}
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loginLoading}
        />
        {emailError ? (
          <Text style={commonStyles.errorText}>{emailError}</Text>
        ) : null}
      </View>

      {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          commonStyles.button,
          loginLoading ? commonStyles.buttonDisabled : null,
        ]}
        onPress={handleSignUp}
        disabled={loginLoading}>
        {loginLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={commonStyles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <PopUpModal
        isVisible={showSuccessModal}
        close={() => setShowSuccessModal(false)}
        title="Check Your Email"
        text="We've sent a one-time verification code to your email address."
        subText="Please check your inbox and enter the code to complete your registration."
      />
    </View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      padding: getSpacing(screenHeight).lg,
    },
    inputContainer: {
      marginBottom: getSpacing(screenHeight).md,
    },
    inputError: {
      borderColor: colors.danger,
    },
  });

export default SignUpForm;
