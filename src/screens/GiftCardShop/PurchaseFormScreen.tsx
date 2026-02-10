import React, {useEffect, useContext, useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
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

import TranslateText from '../../components/TranslateText';
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

  const defaultDenominations = [10, 15, 20, 50, 100].filter(
    d => d >= minAmount && d <= maxAmount,
  );
  const denominations = (brand.denominations || defaultDenominations).slice(
    0,
    5,
  );

  const handleSubmit = async () => {
    try {
      await submit();
    } catch {}
  };

  const errorTextKey =
    error === 'Unauthorized' ? 'unauthorized_purchase_error' : undefined;
  const errorTextValue = error && error !== 'Unauthorized' ? error : undefined;

  const toSignUp = () => {
    navigation.navigate('NexusShopStack', {screen: 'SignUp'});
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <View style={styles.fakeHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}>
        <View style={styles.headerCard}>
          <View style={styles.logoContainer}>
            {brand.logo_url ? (
              <Image source={{uri: brand.logo_url}} style={styles.brandLogo} />
            ) : (
              <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
                <Text style={styles.brandLogoText}>{brand.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brandName}>{brand.name}</Text>
            <Text style={styles.brandPrice}>
              {minAmount === maxAmount
                ? `${minAmount}`
                : `${minAmount} - ${maxAmount}`}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.denominationsRow,
            denominations.length < 5 && styles.denominationsRowLeft,
          ]}>
          {denominations.map(denom => (
            <TouchableOpacity
              key={denom}
              style={[
                styles.denominationButton,
                amount === denom && styles.denominationButtonSelected,
              ]}
              onPress={() => setAmount(Number(denom))}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.denominationText,
                  amount === denom && styles.denominationTextSelected,
                ]}>
                {formatCurrency(currency)}
                {denom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!brand.denominations ? (
          showInputAmount ? (
            <View style={styles.amountInputSection}>
              <TranslateText
                textKey="enter_amount"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                textStyle={styles.sectionTitle}
                numberOfLines={1}
              />
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>
                  {formatCurrency(currency)}
                </Text>
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
          ) : (
            <View style={styles.amountInputSection}>
              <TouchableOpacity
                style={commonStyles.buttonRoundedSecondary}
                onPress={() => setShowInputAmount(true)}
                activeOpacity={0.7}>
                <TranslateText
                  textKey="other_amount"
                  domain="nexusShop"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                  textStyle={commonStyles.buttonTextBlack}
                  numberOfLines={1}
                />
              </TouchableOpacity>
            </View>
          )
        ) : (
          <></>
        )}

        <View style={styles.section}>
          <TranslateText
            textKey="description_title"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionTitle}
            numberOfLines={1}
          />
          <TranslateText
            textKey="gift_card_description"
            domain="nexusShop"
            interpolationObj={{brandName: brand.name}}
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionText}
          />
        </View>

        <View style={styles.section}>
          <TranslateText
            textKey="redeem_instructions_title"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionTitle}
            numberOfLines={1}
          />
          <TranslateText
            textKey="redeem_instructions_text"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.018}
            textStyle={styles.sectionText}
          />
        </View>

        {(errorTextKey || errorTextValue) && (
          <View style={styles.errorContainer}>
            <TranslateText
              textKey={errorTextKey}
              textValue={errorTextValue}
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.errorText}
            />
          </View>
        )}

        {!validation.valid && validation.error && amount > 0 && (
          <View style={styles.errorContainer}>
            <TranslateText
              textValue={validation.error}
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.errorText}
            />
          </View>
        )}

        {error === 'Unauthorized' ? (
          <TouchableOpacity
            style={commonStyles.buttonRounded}
            onPress={toSignUp}
            activeOpacity={0.7}>
            <TranslateText
              textKey="sign_in"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={commonStyles.buttonText}
              numberOfLines={1}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              commonStyles.buttonRounded,
              (!validation.valid || loading) && commonStyles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!validation.valid || loading}
            activeOpacity={0.7}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <TranslateText
                textKey="proceed"
                domain="nexusShop"
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={commonStyles.buttonText}
                numberOfLines={1}
              />
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const PurchaseFormScreen: React.FC<PurchaseFormScreenProps> = ({
  route,
  navigation,
}) => {
  const {brand, initialAmount, currency, onPaymentSuccess} = route.params;
  const client = useMemo(() => new GiftCardClient(), []);

  const handleInitiate = (initiateResponse: InitiatePurchaseResponseData) => {
    navigation.navigate('PayForGiftCard', {
      initiateResponse,
      onPaymentSuccess,
    });
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
    },
    fakeHeader: {
      width: screenWidth,
      height: deviceHeaderHeight + screenHeight * 0.008,
      backgroundColor: '#0070F0',
    },
    scrollView: {
      flex: 1,
      zIndex: 1,
    },
    formContainer: {
      padding: screenWidth * 0.04,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      padding: getSpacing(screenWidth, screenHeight).md,
      marginBottom: screenHeight * 0.02,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    logoContainer: {
      width: screenWidth * 0.2,
      height: screenWidth * 0.15,
      backgroundColor: colors.grayLight,
      borderRadius: getBorderRadius(screenHeight).md,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    brandLogo: {
      width: '80%',
      height: '80%',
      resizeMode: 'contain',
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
      justifyContent: 'space-between',
      marginBottom: screenHeight * 0.02,
    },
    denominationsRowLeft: {
      justifyContent: 'center',
      gap: screenWidth * 0.03,
    },
    denominationButton: {
      minWidth: screenWidth * 0.15,
      minHeight: screenWidth * 0.12,
      borderWidth: 1,
      borderColor: colors.grayLight,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: screenHeight * 0.012,
    },
    denominationButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    denominationText: {
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      color: colors.text,
    },
    denominationTextSelected: {
      color: colors.white,
    },
    amountInputSection: {
      marginBottom: screenHeight * 0.04,
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
    amountHint: {
      marginTop: getSpacing(screenWidth, screenHeight).sm,
      fontSize: screenHeight * 0.016,
      color: colors.textSecondary,
    },
    section: {
      borderBottomWidth: 1,
      borderBottomColor: colors.grayLight,
      marginBottom: screenHeight * 0.04,
    },
    sectionTitle: {
      fontSize: screenHeight * 0.016,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
      letterSpacing: 0.5,
    },
    sectionText: {
      fontSize: screenHeight * 0.016,
      color: colors.text,
      lineHeight: getFontSize(screenHeight).md * 1.5,
    },
    errorContainer: {
      paddingHorizontal: screenWidth * 0.02,
      marginBottom: screenHeight * 0.02,
    },
    errorText: {
      color: colors.danger,
      fontSize: screenHeight * 0.018,
      textAlign: 'center',
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
