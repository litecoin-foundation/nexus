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
import {Brand, GiftCard} from '../../services/giftcards';
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
  onBack: () => void;
  onSuccess: (giftCard: GiftCard) => void;
}

export function PurchaseForm({brand, onBack, onSuccess}: PurchaseFormProps) {
  const {
    amount,
    setAmount,
    currency,
    validation,
    submit,
    loading,
    error,
    purchasedCard,
  } = usePurchaseFlow(brand);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    if (purchasedCard) {
      onSuccess(purchasedCard);
    }
  }, [purchasedCard, onSuccess]);

  const hasDenominations =
    brand.denominations && brand.denominations.length > 0;

  const handleSubmit = async () => {
    try {
      await submit();
    } catch {}
  };

  if (__DEV__) {
    // console.log('Brand: ' + JSON.stringify(brand, null, 2));
    console.log('PurchaseForm state:', {
      amount,
      validation,
      loading,
      error,
      hasDenominations,
      currency,
    });
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.formContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.brandHeader}>
        {brand.logo_url ? (
          <Image
            source={{uri: brand.logo_url}}
            style={styles.brandHeaderLogo}
          />
        ) : (
          <View style={[styles.brandHeaderLogo, styles.brandLogoPlaceholder]}>
            <Text style={styles.brandLogoText}>{brand.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={commonStyles.title}>{brand.name}</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={commonStyles.label}>Select Amount</Text>

        {hasDenominations ? (
          <View style={styles.denominationGrid}>
            {brand.denominations!.map(denom => (
              <TouchableOpacity
                key={denom}
                style={[
                  styles.denominationButton,
                  amount === denom && styles.denominationButtonSelected,
                ]}
                onPress={() => setAmount(denom)}>
                <Text
                  style={[
                    styles.denominationText,
                    amount === denom && styles.denominationTextSelected,
                  ]}>
                  {denom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount > 0 ? amount.toString() : ''}
              onChangeText={text => setAmount(parseFloat(text) || 0)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.grayMedium}
            />
          </View>
        )}

        {!validation.valid && validation.error && amount > 0 && (
          <Text style={commonStyles.errorText}>{validation.error}</Text>
        )}

        {brand.digital_face_value_limits && (
          <Text
            style={[
              commonStyles.caption,
              {marginTop: getSpacing(SCREEN_HEIGHT).sm},
            ]}>
            {`Min: ${brand.digital_face_value_limits.lower} | Max: ${brand.digital_face_value_limits.upper}`}
          </Text>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          commonStyles.button,
          (!validation.valid || loading) && commonStyles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!validation.valid || loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={commonStyles.buttonText}>
            Purchase {amount > 0 ? amount : ''} Gift Card
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    formContainer: {
      padding: getSpacing(screenHeight).md,
    },
    backButton: {
      marginBottom: getSpacing(screenHeight).md,
    },
    backButtonText: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.primary,
    },
    brandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getSpacing(screenHeight).lg,
    },
    brandHeaderLogo: {
      width: 50,
      height: 50,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginRight: getSpacing(screenHeight).md,
    },
    brandLogoPlaceholder: {
      backgroundColor: colors.grayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandLogoText: {
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.gray,
    },
    formSection: {
      marginBottom: getSpacing(screenHeight).lg,
    },
    denominationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getSpacing(screenHeight).sm,
    },
    denominationButton: {
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: getBorderRadius(screenHeight).sm,
      marginRight: getSpacing(screenHeight).sm,
      marginBottom: getSpacing(screenHeight).sm,
    },
    denominationButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    denominationText: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
    },
    denominationTextSelected: {
      color: colors.white,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: getBorderRadius(screenHeight).sm,
      backgroundColor: colors.white,
    },
    currencySymbol: {
      paddingHorizontal: getSpacing(screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.textSecondary,
      backgroundColor: colors.grayLight,
      paddingVertical: getSpacing(screenHeight).md,
    },
    amountInput: {
      flex: 1,
      fontSize: getFontSize(screenHeight).xl,
      paddingHorizontal: getSpacing(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
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
  });
