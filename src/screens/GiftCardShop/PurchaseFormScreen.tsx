import React, {
  useEffect,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {useHeaderHeight} from '@react-navigation/elements';
import {
  Brand,
  GiftCardClient,
  InitiatePurchaseResponseData,
  formatCurrency,
} from '../../services/giftcards';
import {
  GiftCardProvider,
  usePurchaseFlow,
} from '../../components/GiftCardShop/hooks';
import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from '../../components/GiftCardShop/theme';
import HeaderButton from '../../components/Buttons/HeaderButton';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import TOSCheckModal from '../../components/Modals/TOSCheckModal';
import {ScreenSizeContext} from '../../context/screenSize';

interface PurchaseFormScreenProps {
  route: {
    params: {
      brand: Brand;
      initialAmount?: number;
      currency: string;
      onPaymentSuccess: (txid: string) => void;
    };
  };
  navigation: any;
}

interface PurchaseFormContentProps {
  brand: Brand;
  initialAmount?: number;
  currency: string;
  onInitiate: (initiateResponse: InitiatePurchaseResponseData) => void;
  navigation: any;
}

const AnimatedPressable: React.FC<{
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}> = ({onPress, disabled, style, children}) => {
  const scaler = useSharedValue(1);
  const motionStyle = useAnimatedStyle(() => ({
    transform: [{scale: scaler.value}],
  }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scaler.value = withSpring(0.96, {mass: 1});
      }}
      onPressOut={() => {
        scaler.value = withSpring(1, {mass: 0.7});
      }}>
      <Animated.View style={[style, motionStyle]}>{children}</Animated.View>
    </Pressable>
  );
};

const PurchaseFormContent: React.FC<PurchaseFormContentProps> = ({
  brand,
  initialAmount,
  currency,
  onInitiate,
  navigation,
}) => {
  const {
    amount,
    setAmount,
    validation,
    submit,
    loading,
    error,
    initiateResponse,
  } = usePurchaseFlow(brand, currency);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const deviceHeaderHeight = useHeaderHeight();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, deviceHeaderHeight);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [amountText, setAmountText] = useState(
    amount > 0 ? amount.toString() : '',
  );
  const [showInputAmount, setShowInputAmount] = useState(false);
  const [inputContentHeight, setInputContentHeight] = useState<number | null>(
    null,
  );
  const inputHeightAnim = useSharedValue(0);
  const inputOpacityAnim = useSharedValue(0);

  const onInputContentLayout = useCallback(
    (e: {nativeEvent: {layout: {height: number}}}) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0 && inputContentHeight === null) {
        setInputContentHeight(h);
      }
    },
    [inputContentHeight],
  );

  useEffect(() => {
    if (inputContentHeight !== null) {
      if (showInputAmount) {
        inputHeightAnim.value = withTiming(inputContentHeight, {duration: 300});
        inputOpacityAnim.value = withTiming(1, {duration: 250});
      } else {
        inputHeightAnim.value = withTiming(0, {duration: 300});
        inputOpacityAnim.value = withTiming(0, {duration: 200});
      }
    }
  }, [showInputAmount, inputContentHeight, inputHeightAnim, inputOpacityAnim]);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    height: inputHeightAnim.value,
    opacity: inputOpacityAnim.value,
    overflow: 'hidden' as const,
  }));

  // Sync text when amount changes externally (e.g., denomination buttons)
  useEffect(() => {
    const parsedText = parseFloat(amountText.replace(',', '.'));
    if (amount > 0 && amount !== parsedText) {
      setAmountText(amount.toString());
    } else if (amount === 0 && parsedText > 0) {
      setAmountText('');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [amount]);

  useEffect(() => {
    if (initiateResponse) {
      onInitiate(initiateResponse);
    }
  }, [initiateResponse, onInitiate]);

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
      setAmountText(initialAmount.toString());
    }
  }, [initialAmount, setAmount]);

  const minAmount = Number(
    brand.digital_face_value_limits?.lower || brand.denominations?.[0],
  );
  const maxAmount = Number(
    brand.digital_face_value_limits?.upper ||
      brand.denominations?.[brand.denominations.length - 1],
  );

  const denominations = (() => {
    const MAX_BUTTONS = 5;
    const allDenoms = brand.denominations?.map(Number).sort((a, b) => a - b);

    if (allDenoms && allDenoms.length > 0) {
      if (allDenoms.length <= MAX_BUTTONS) {
        return allDenoms;
      }
      // Always include first and last, pick evenly-spaced ones in between
      const result: number[] = [allDenoms[0]];
      const innerCount = MAX_BUTTONS - 2;
      for (let i = 1; i <= innerCount; i++) {
        const idx = Math.round((i * (allDenoms.length - 1)) / (innerCount + 1));
        if (!result.includes(allDenoms[idx])) {
          result.push(allDenoms[idx]);
        }
      }
      if (!result.includes(allDenoms[allDenoms.length - 1])) {
        result.push(allDenoms[allDenoms.length - 1]);
      }
      return result;
    }

    // Range-based brand: generate nice round values spread across the range
    if (isNaN(minAmount) || isNaN(maxAmount) || minAmount >= maxAmount) {
      return [minAmount].filter(v => !isNaN(v));
    }
    const candidates = [
      5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 125, 150, 175, 200, 250,
      300, 400, 500, 750, 1000,
    ].filter(d => d >= minAmount && d <= maxAmount);

    if (candidates.length <= MAX_BUTTONS) {
      const result = [...candidates];
      if (!result.includes(minAmount)) result.unshift(minAmount);
      if (!result.includes(maxAmount)) result.push(maxAmount);
      return result.slice(0, MAX_BUTTONS);
    }

    // Pick evenly-spaced candidates, always including first and last
    const result: number[] = [candidates[0]];
    const innerCount = MAX_BUTTONS - 2;
    for (let i = 1; i <= innerCount; i++) {
      const idx = Math.round((i * (candidates.length - 1)) / (innerCount + 1));
      if (!result.includes(candidates[idx])) {
        result.push(candidates[idx]);
      }
    }
    if (!result.includes(candidates[candidates.length - 1])) {
      result.push(candidates[candidates.length - 1]);
    }
    return result;
  })();

  const toSignUp = () => {
    navigation.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  const handleSubmit = async () => {
    try {
      await submit();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'Unauthorized') {
        toSignUp();
      }
    }
  };

  const errorTextValue = error && error !== 'Unauthorized' ? error : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.blueHeader}>
        <View style={styles.headerCard}>
          <View
            style={
              brand.logo_url
                ? styles.logoContainer
                : styles.logoContainerPlaceholder
            }>
            {brand.logo_url ? (
              <Image source={{uri: brand.logo_url}} style={styles.brandLogo} />
            ) : (
              <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
                <TranslateText
                  textValue={brand.name.charAt(0)}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.024}
                  textStyle={styles.brandLogoText}
                  numberOfLines={1}
                />
              </View>
            )}
          </View>
          <View style={styles.brandInfo}>
            <TranslateText
              textValue={brand.name}
              maxSizeInPixels={SCREEN_HEIGHT * 0.016}
              textStyle={styles.brandName}
              numberOfLines={2}
              maxLengthInPixels={SCREEN_WIDTH * 0.5}
            />
            <TranslateText
              textValue={
                minAmount === maxAmount
                  ? `${formatCurrency(currency)}${minAmount}`
                  : `${formatCurrency(currency)}${minAmount} - ${formatCurrency(currency)}${maxAmount}`
              }
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.brandPrice}
              numberOfLines={1}
            />
          </View>
        </View>

        <View
          style={[
            styles.denominationsRow,
            denominations.length < 5 && styles.denominationsRowLeft,
          ]}>
          {denominations.map(denom => (
            <AnimatedPressable
              key={denom}
              style={[
                styles.denominationButton,
                amount === Number(denom) && styles.denominationButtonSelected,
              ]}
              onPress={() => setAmount(Number(denom))}>
              <TranslateText
                textValue={`${formatCurrency(currency)}${denom}`}
                maxSizeInPixels={SCREEN_HEIGHT * 0.017}
                textStyle={[
                  styles.denominationText,
                  amount === Number(denom) && styles.denominationTextSelected,
                ]}
                numberOfLines={1}
              />
            </AnimatedPressable>
          ))}
        </View>

        {!brand.denominations ? (
          <View style={styles.amountInputSection}>
            <AnimatedPressable
              style={styles.otherAmountToggle}
              onPress={() => setShowInputAmount(!showInputAmount)}>
              <TranslateText
                textKey="other_amount"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                textStyle={styles.otherAmountToggleText}
                numberOfLines={1}
              />
              <TranslateText
                textValue={'\u25BC'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.01}
                textStyle={[
                  styles.otherAmountChevron,
                  showInputAmount && styles.otherAmountChevronOpen,
                ]}
                numberOfLines={1}
              />
            </AnimatedPressable>
            <Animated.View
              style={
                inputContentHeight === null
                  ? {position: 'absolute', opacity: 0, zIndex: -1}
                  : inputAnimatedStyle
              }>
              <View
                onLayout={onInputContentLayout}
                style={styles.amountInputContent}>
                <TranslateText
                  textKey="enter_amount"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.enterAmountTitle}
                  numberOfLines={1}
                />
                <View style={styles.amountInputContainer}>
                  <TranslateText
                    textValue={formatCurrency(currency)}
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.currencySymbol}
                    numberOfLines={1}
                  />
                  <TextInput
                    style={styles.amountInput}
                    value={amountText}
                    onChangeText={text => {
                      setAmountText(text);
                      const normalized = text.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      setAmount(isNaN(parsed) ? 0 : parsed);
                    }}
                    placeholder={`${minAmount} - ${maxAmount}`}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.grayMedium}
                  />
                </View>
                <TranslateText
                  textKey="enter_amount_hint"
                  domain="nexusShop"
                  interpolationObj={{
                    currencySymbol: formatCurrency(currency),
                    min: minAmount,
                    max: maxAmount,
                  }}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={styles.amountHint}
                  numberOfLines={1}
                />
              </View>
            </Animated.View>
          </View>
        ) : (
          <></>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}>
        <View style={styles.section}>
          <TranslateText
            textKey="description_title"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionTitle}
            numberOfLines={1}
          />
          {brand.description ? (
            <TranslateText
              textValue={brand.description}
              interpolationObj={{brandName: brand.name}}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.sectionText}
            />
          ) : (
            <TranslateText
              textKey="gift_card_description"
              domain="nexusShop"
              interpolationObj={{brandName: brand.name}}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.sectionText}
            />
          )}
        </View>

        <View style={styles.section}>
          <TranslateText
            textKey="redeem_instructions_title"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionTitle}
            numberOfLines={1}
          />
          {brand.terms ? (
            <TranslateText
              textValue={brand.terms}
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.sectionText}
            />
          ) : (
            <TranslateText
              textKey="redeem_instructions_text"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.sectionText}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomSafeAreaView
          styles={styles.safeArea}
          edges={Platform.OS === 'android' ? ['bottom'] : []}>
          <AnimatedPressable
            style={[
              commonStyles.buttonRounded,
              (!validation.valid || loading) && commonStyles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!validation.valid || loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <TranslateText
                textKey="continue_purchase"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            )}
          </AnimatedPressable>

          {errorTextValue && (
            <TranslateText
              textValue={errorTextValue}
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.underButtonText}
            />
          )}

          {!validation.valid && validation.error && amount > 0 && (
            <TranslateText
              textValue={validation.error}
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.underButtonText}
            />
          )}
        </CustomSafeAreaView>
      </View>
    </View>
  );
};

const PurchaseFormScreen: React.FC<PurchaseFormScreenProps> = ({
  route,
  navigation,
}) => {
  const {brand, initialAmount, currency, onPaymentSuccess} = route.params;
  const client = useMemo(() => new GiftCardClient(), []);

  const [showTOS, setShowTOS] = useState(false);
  const [pendingResponse, setPendingResponse] =
    useState<InitiatePurchaseResponseData | null>(null);

  const handleInitiate = (initiateResponse: InitiatePurchaseResponseData) => {
    setPendingResponse(initiateResponse);
    setShowTOS(true);
  };

  const handleTOSContinue = () => {
    setShowTOS(false);
    if (pendingResponse) {
      navigation.navigate('PayForGiftCard', {
        initiateResponse: pendingResponse,
        onPaymentSuccess,
      });
      setPendingResponse(null);
    }
  };

  return (
    <GiftCardProvider client={client}>
      <PurchaseFormContent
        brand={brand}
        initialAmount={initialAmount}
        currency={currency}
        onInitiate={handleInitiate}
        navigation={navigation}
      />
      <TOSCheckModal
        isVisible={showTOS}
        close={() => setShowTOS(false)}
        onContinue={handleTOSContinue}
      />
    </GiftCardProvider>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  deviceHeaderHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f7f7f7',
    },
    blueHeader: {
      width: screenWidth,
      backgroundColor: '#0070F0',
      paddingTop: deviceHeaderHeight + screenHeight * 0.02,
      paddingHorizontal: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.02,
      borderBottomLeftRadius: screenHeight * 0.04,
      borderBottomRightRadius: screenHeight * 0.04,
    },
    scrollView: {
      flex: 1,
      zIndex: 1,
    },
    formContainer: {
      padding: screenWidth * 0.04,
      paddingBottom: screenHeight * 0.15,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      paddingHorizontal: screenHeight * 0.01,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    logoContainer: {
      width: screenWidth * 0.3,
      height: screenWidth * 0.2,
      borderRadius: screenHeight * 0.012,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    logoContainerPlaceholder: {
      width: screenWidth * 0.24,
      height: screenWidth * 0.16,
      backgroundColor: colors.grayLight,
      borderRadius: screenHeight * 0.012,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginVertical: screenWidth * 0.02,
    },
    brandLogo: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    brandLogoPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.grayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandLogoText: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.gray,
    },
    brandInfo: {
      flex: 1,
      marginLeft: getSpacing(screenWidth, screenHeight).md,
    },
    brandName: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    brandPrice: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
      marginTop: getSpacing(screenWidth, screenHeight).xs,
    },
    denominationsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: screenWidth * 0.025,
      marginTop: screenHeight * 0.015,
      marginBottom: screenHeight * 0.005,
    },
    denominationsRowLeft: {
      gap: screenWidth * 0.03,
    },
    denominationButton: {
      minWidth: screenWidth * 0.15,
      minHeight: screenWidth * 0.12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: screenHeight * 0.012,
    },
    denominationButtonSelected: {
      backgroundColor: colors.white,
      borderColor: colors.white,
    },
    denominationText: {
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      color: colors.white,
    },
    denominationTextSelected: {
      color: colors.primary,
    },
    amountInputSection: {
      marginBottom: screenHeight * 0.005,
    },
    otherAmountToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      justifyContent: 'center',
      paddingVertical: screenHeight * 0.012,
      paddingHorizontal: screenWidth * 0.08,
    },
    otherAmountToggleText: {
      fontSize: screenHeight * 0.016,
      fontWeight: '600',
      color: colors.white,
    },
    otherAmountChevron: {
      fontSize: screenHeight * 0.01,
      color: 'rgba(255,255,255,0.7)',
      marginLeft: screenWidth * 0.02,
    },
    otherAmountChevronOpen: {
      transform: [{rotate: '180deg'}],
    },
    amountInputContent: {
      paddingTop: screenHeight * 0.015,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).md,
      borderWidth: 1,
      borderColor: colors.grayLight,
      overflow: 'hidden',
    },
    currencySymbol: {
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
    },
    amountInput: {
      flex: 1,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
      color: colors.text,
    },
    enterAmountTitle: {
      fontSize: screenHeight * 0.016,
      fontWeight: '700',
      color: colors.white,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
      letterSpacing: 0.5,
    },
    amountHint: {
      marginTop: getSpacing(screenWidth, screenHeight).sm,
      fontSize: screenHeight * 0.016,
      color: 'rgba(255,255,255,0.7)',
    },
    section: {
      marginBottom: screenHeight * 0.015,
      paddingBottom: screenHeight * 0.01,
    },
    sectionTitle: {
      fontSize: screenHeight * 0.016,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
      letterSpacing: 0.5,
    },
    sectionText: {
      fontSize: screenHeight * 0.016,
      color: colors.text,
      lineHeight: getFontSize(screenHeight).md * 1.5,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.03,
      left: screenWidth * 0.04,
      right: screenWidth * 0.04,
      zIndex: 2,
    },
    safeArea: {},
    underButtonText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      textAlign: 'center',
      marginTop: screenHeight * 0.01,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const PurchaseFormScreenOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width, height} = useContext(ScreenSizeContext);
  const deviceHeaderHeight = useHeaderHeight();
  const styles = getStyles(width, height, deviceHeaderHeight);

  return {
    headerTransparent: true,
    headerTitle: () => (
      <TranslateText
        textKey="purchase"
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

export default PurchaseFormScreen;
