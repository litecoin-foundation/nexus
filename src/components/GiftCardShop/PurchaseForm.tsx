import React from 'react';
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
import {colors, spacing, borderRadius, fontSize, commonStyles} from './theme';

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

  React.useEffect(() => {
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
          <Text style={[commonStyles.caption, {marginTop: spacing.sm}]}>
            {`Min: ${brand.digital_face_value_limits.minimum} | Max: ${brand.digital_face_value_limits.maximum}`}
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

const styles = StyleSheet.create({
  formContainer: {
    padding: spacing.md,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandHeaderLogo: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  brandLogoPlaceholder: {
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  denominationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  denominationButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  denominationButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  denominationText: {
    fontSize: fontSize.md,
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
  },
  currencySymbol: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.grayLight,
    paddingVertical: spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: fontSize.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
});
