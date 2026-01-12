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
import {useNavigation} from '@react-navigation/native';
import type {
  StackNavigationProp,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {NexusShopStackParamList} from '../../navigation/NexusShopStack';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '../../store/hooks';
import {
  registerOnNexusShop,
  clearAccount,
} from '../../reducers/nexusshopaccount';
import {
  colors,
  getSpacing,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import HeaderButton from '../../components/Buttons/HeaderButton';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const SignUp: React.FC<Props> = () => {
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
  const [loginError, setLoginError] = useState('');

  const {loginLoading} = useSelector((state: any) => state.nexusshopaccount);
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
      await dispatch(registerOnNexusShop(email.trim(), uniqueId));
      navigation.navigate('VerifyOTP');
    } catch {
      Alert.alert('Sign Up Failed', 'Please try again later.');
    }
  };

  // const handleToVerification = () => {
  //   navigation.navigate('VerifyOTP');
  // };

  const handleResetShopUser = () => {
    dispatch(clearAccount());
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <CustomSafeAreaView styles={styles.safeArea} edges={['bottom']}>
        <View style={styles.topContainer}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={require('../../assets/images/shop-card.png')}
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
          {loginError ? (
            <Text style={commonStyles.errorText}>{loginError}</Text>
          ) : null}

          {/* {shopUserEmail === email ? (
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
                <Text style={commonStyles.buttonText}>Sign Up / Sign In</Text>
              )}
            </TouchableOpacity>
          )} */}

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
              <Text style={commonStyles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {__DEV__ ? (
            <View style={styles.resetButtonContainer}>
              <TouchableOpacity
                style={commonStyles.buttonRounded}
                onPress={handleResetShopUser}>
                <Text style={commonStyles.buttonText}>Reset Shop User</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <></>
          )}
        </View>
      </CustomSafeAreaView>
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
    },
    topContainer: {
      width: '100%',
      height: screenHeight * 0.42,
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
      marginBottom: screenHeight * 0.12 * -1,
    },
    image: {
      width: '80%',
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
    inputContainer: {},
    inputError: {
      borderColor: colors.danger,
    },
    buttonContainer: {
      width: '100%',
      padding: getSpacing(screenWidth, screenHeight).xl,
    },
    resetButtonContainer: {
      paddingTop: 10,
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
        textKey="sign_in"
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

export default SignUp;
