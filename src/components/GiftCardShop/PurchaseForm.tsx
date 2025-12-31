import React, {useEffect, useContext} from 'react';
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
import {Brand, InitiatePurchaseResponseData} from '../../services/giftcards';
import {usePurchaseFlow} from './hooks';
import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from './theme';

import {ScreenSizeContext} from '../../context/screenSize';

interface PurchaseFormProps {
  brand: Brand;
  initialAmount?: number;
  onBack: () => void;
  onInitiate: (initiateResponse: InitiatePurchaseResponseData) => void;
}

export function PurchaseForm({
  brand,
  initialAmount,
  onBack: _onBack,
  onInitiate,
}: PurchaseFormProps) {
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
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    if (initiateResponse) {
      onInitiate(initiateResponse);
    }
  }, [initiateResponse, onInitiate]);

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
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
    <ScrollView
      style={commonStyles.container}
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
              value={amount > 0 ? amount.toString() : ''}
              onChangeText={text => setAmount(parseFloat(text) || 0)}
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
          <Text style={styles.purchaseButtonText}>Confirm purchase</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    formContainer: {
      padding: getSpacing(screenHeight).md,
      paddingBottom: getSpacing(screenHeight).xl,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).lg,
      padding: getSpacing(screenHeight).md,
      marginBottom: getSpacing(screenHeight).md,
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
      marginLeft: getSpacing(screenHeight).md,
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
      marginTop: getSpacing(screenHeight).xs,
    },
    denominationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: getSpacing(screenHeight).lg,
    },
    denominationsRowLeft: {
      justifyContent: 'flex-start',
      gap: getSpacing(screenHeight).sm,
    },
    denominationButton: {
      paddingVertical: getSpacing(screenHeight).sm,
      paddingHorizontal: getSpacing(screenHeight).md,
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
      marginBottom: getSpacing(screenHeight).lg,
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
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
      backgroundColor: colors.grayLight,
    },
    amountInput: {
      flex: 1,
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
      color: colors.text,
    },
    amountHint: {
      marginTop: getSpacing(screenHeight).sm,
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: getSpacing(screenHeight).lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.grayLight,
      paddingBottom: getSpacing(screenHeight).md,
    },
    sectionTitle: {
      fontSize: getFontSize(screenHeight).sm,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: getSpacing(screenHeight).sm,
      letterSpacing: 0.5,
    },
    sectionText: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.text,
      lineHeight: getFontSize(screenHeight).md * 1.5,
    },
    errorContainer: {
      backgroundColor: colors.dangerLight,
      padding: getSpacing(screenHeight).md,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginBottom: getSpacing(screenHeight).md,
    },
    errorMessage: {
      color: colors.danger,
      fontSize: getFontSize(screenHeight).sm,
    },
    validationError: {
      marginBottom: getSpacing(screenHeight).md,
    },
    purchaseButton: {
      backgroundColor: colors.primary,
      borderRadius: getBorderRadius(screenHeight).lg,
      paddingVertical: getSpacing(screenHeight).md,
      alignItems: 'center',
      marginTop: getSpacing(screenHeight).md,
    },
    purchaseButtonDisabled: {
      opacity: 0.6,
    },
    purchaseButtonText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.white,
    },
  });
