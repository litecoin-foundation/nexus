import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {NexusShopStackParamList} from '../../navigation/NexusShopStack';
import {useAppDispatch} from '../../store/hooks';
import {
  loginToNexusShop,
  loginToNexusShopTest,
  clearAccount,
} from '../../reducers/nexusshopaccount';
import {colors, getSpacing, getCommonStyles} from './theme';
// import PopUpModal from '../Modals/PopUpModal';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const SignUpForm: React.FC<Props> = () => {
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const shopUserEmail = account && account.email;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [email, setEmail] = useState(shopUserEmail || '');
  const [emailError, setEmailError] = useState('');
  // const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<StackNavigationProp<NexusShopStackParamList>>();
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
        // dispatch(loginToNexusShopTest(email.trim(), uniqueId));
        dispatch(loginToNexusShop(email.trim(), uniqueId));
      } else {
        dispatch(loginToNexusShop(email.trim(), uniqueId));
      }

      // setShowSuccessModal(true);
      navigation.navigate('VerifyOTP');
    } catch {
      Alert.alert('Sign Up Failed', 'Please try again later.');
    }
  };

  const handleToVerification = () => {
    navigation.navigate('VerifyOTP');
  };

  const handleResetShopUser = () => {
    dispatch(clearAccount());
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={{...styles.safeArea}} edges={['bottom']}>
        <View style={styles.topContainer}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={require('../../assets/images/gramophone-art.png')}
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={commonStyles.title}>Sign Up for Nexus Shop</Text>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.label}>Email Address</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  emailError ? styles.inputError : null,
                ]}
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
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          {shopUserEmail === email ? (
            <TouchableOpacity
              style={commonStyles.buttonRoundedGreen}
              onPress={handleToVerification}>
              <Text style={commonStyles.buttonText}>Verify</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                commonStyles.buttonRounded,
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
          )}
        </View>

        {__DEV__ ? (
          <View style={styles.buttonContainer}>
            <Text style={commonStyles.errorText}>DEV</Text>
            <TouchableOpacity
              style={commonStyles.buttonRounded}
              onPress={handleResetShopUser}>
              <Text style={commonStyles.buttonText}>Reset Shop User</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <></>
        )}

        {/* <PopUpModal
          isVisible={showSuccessModal}
          close={() => setShowSuccessModal(false)}
          title="Check Your Email"
          text="We've sent a one-time verification code to your email address."
          subText="Please check your inbox and enter the code to complete your registration."
        /> */}
      </CustomSafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.62,
      backgroundColor: '#0070F0',
      borderBottomLeftRadius: screenHeight * 0.04,
      borderBottomRightRadius: screenHeight * 0.04,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: screenHeight * 0.55,
      marginBottom: screenHeight * 0.12 * -1,
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    formContainer: {
      width: '100%',
      paddingLeft: getSpacing(screenHeight).xl,
      paddingRight: getSpacing(screenHeight).xl,
      paddingBottom: getSpacing(screenHeight).xl,
    },
    inputContainer: {},
    inputError: {
      borderColor: colors.danger,
    },
    buttonContainer: {
      width: '100%',
      padding: getSpacing(screenHeight).xl,
    },
  });

export default SignUpForm;
