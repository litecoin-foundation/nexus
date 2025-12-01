import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {Brand, GiftCard} from '../../services/giftcards';
import {colors, spacing, borderRadius, fontSize, commonStyles} from './theme';

interface PurchaseSuccessProps {
  giftCard: GiftCard;
  brand: Brand;
  onDone: () => void;
}

export function PurchaseSuccess({
  giftCard,
  brand,
  onDone,
}: PurchaseSuccessProps) {
  const copyCode = () => {
    if (giftCard.redeemCode) {
      Clipboard.setString(giftCard.redeemCode);
      Alert.alert('Copied!', 'Gift card code copied to clipboard');
    }
  };

  const openUrl = () => {
    if (giftCard.redeemUrl) {
      Linking.openURL(giftCard.redeemUrl);
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.successContainer}>
      <View style={commonStyles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>

      <Text style={commonStyles.title}>Purchase Complete!</Text>

      <View style={styles.giftCardDisplay}>
        <Text style={styles.giftCardBrand}>{brand.name}</Text>
        <Text style={styles.giftCardAmount}>{giftCard.faceValue.amount}</Text>

        {giftCard.redeemUrl && (
          <TouchableOpacity style={styles.redeemButton} onPress={openUrl}>
            <Text style={styles.redeemButtonText}>Open Gift Card →</Text>
          </TouchableOpacity>
        )}

        {giftCard.redeemCode && (
          <View style={styles.codeContainer}>
            <Text style={commonStyles.label}>Gift Card Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{giftCard.redeemCode}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            {giftCard.pin && (
              <View style={{marginTop: spacing.md}}>
                <Text style={commonStyles.label}>PIN</Text>
                <Text style={styles.codeText}>{giftCard.pin}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[commonStyles.caption, {marginTop: spacing.md}]}>
          Expires: {new Date(giftCard.expirationDate).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={[commonStyles.button, {backgroundColor: colors.success}]}
        onPress={onDone}>
        <Text style={commonStyles.buttonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  successContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIconText: {
    fontSize: 40,
    color: colors.white,
  },
  giftCardDisplay: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  giftCardBrand: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  giftCardAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.success,
    marginVertical: spacing.sm,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  codeContainer: {
    backgroundColor: colors.grayLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    width: '100%',
    marginTop: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  copyButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
