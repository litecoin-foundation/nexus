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
} from 'react-native';
import type {StackNavigationOptions} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useHeaderHeight} from '@react-navigation/elements';
import {
  Brand,
  GiftCardClient,
  InitiatePurchaseResponseData,
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
      onPaymentSuccess: (txid: string) => void;
    };
  };
  navigation: any;
}

interface PurchaseFormContentProps {
  brand: Brand;
  initialAmount?: number;
  onInitiate: (initiateResponse: InitiatePurchaseResponseData) => void;
}

const PurchaseFormContent: React.FC<PurchaseFormContentProps> = ({
  brand,
  initialAmount,
  onInitiate,
}) => {
  const {
    amount,
    setAmount,
    currency,
    validation,
    submit,
    loading,
    error,
    initiateResponse,
  } = usePurchaseFlow(brand);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const deviceHeaderHeight = useHeaderHeight();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, deviceHeaderHeight);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [amountText, setAmountText] = useState(
    amount > 0 ? amount.toString() : '',
  );

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
                {currency === 'USD' ? '$' : ''}
                {denom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!brand.denominations ? (
          <View style={styles.amountInputSection}>
            <Text style={styles.sectionTitle}>ENTER AMOUNT</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>
                {currency === 'USD' ? '$' : currency}
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
            <Text style={styles.amountHint}>
              Enter amount between {minAmount} and {maxAmount}
            </Text>
          </View>
        ) : (
          <></>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.sectionText}>
            {brand.name} gift card can be redeemed for merchandise at any{' '}
            {brand.name} location or online store.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REDEEM INSTRUCTIONS</Text>
          <Text style={styles.sectionText}>
            You can redeem the card by providing the code at checkout.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {!validation.valid && validation.error && amount > 0 && (
          <Text style={[commonStyles.errorText, styles.validationError]}>
            {validation.error}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!validation.valid || loading) && styles.purchaseButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validation.valid || loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>Proceed</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const PurchaseFormScreen: React.FC<PurchaseFormScreenProps> = ({
  route,
  navigation,
}) => {
  const {brand, initialAmount, onPaymentSuccess} = route.params;
  const client = useMemo(() => new GiftCardClient(), []);

  const handleInitiate = (initiateResponse: InitiatePurchaseResponseData) => {
    navigation.replace('PayForGiftCard', {
      initiateResponse,
      onPaymentSuccess,
    });
  };

  return (
    <GiftCardProvider client={client}>
      <PurchaseFormContent
        brand={brand}
        initialAmount={initialAmount}
        onInitiate={handleInitiate}
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
      padding: getSpacing(screenWidth, screenHeight).md,
      paddingBottom: getSpacing(screenWidth, screenHeight).xl,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      padding: getSpacing(screenWidth, screenHeight).md,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
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
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
    denominationsRowLeft: {
      justifyContent: 'flex-start',
      gap: getSpacing(screenWidth, screenHeight).sm,
    },
    denominationButton: {
      paddingVertical: getSpacing(screenWidth, screenHeight).sm,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).md,
      borderWidth: 1,
      borderColor: colors.grayLight,
      backgroundColor: colors.white,
      minWidth: screenWidth * 0.15,
      alignItems: 'center',
    },
    denominationButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    denominationText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '500',
      color: colors.text,
    },
    denominationTextSelected: {
      color: colors.white,
    },
    amountInputSection: {
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
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
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.grayLight,
      paddingBottom: getSpacing(screenWidth, screenHeight).md,
    },
    sectionTitle: {
      fontSize: getFontSize(screenHeight).sm,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
      letterSpacing: 0.5,
    },
    sectionText: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.text,
      lineHeight: getFontSize(screenHeight).md * 1.5,
    },
    errorContainer: {
      backgroundColor: colors.dangerLight,
      padding: getSpacing(screenWidth, screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    errorMessage: {
      color: colors.danger,
      fontSize: getFontSize(screenHeight).sm,
    },
    validationError: {
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    purchaseButton: {
      backgroundColor: colors.primary,
      borderRadius: getBorderRadius(screenHeight).lg,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      alignItems: 'center',
      marginTop: getSpacing(screenWidth, screenHeight).md,
    },
    purchaseButtonDisabled: {
      opacity: 0.6,
    },
    purchaseButtonText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.white,
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

export default PurchaseFormScreen;
