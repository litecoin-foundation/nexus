import React, {useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {InitiatePurchaseResponseData, GiftCard} from '../../services/giftcards';
import {usePurchaseGiftCard} from './hooks';
import {
  colors,
  getSpacing,
  getBorderRadius,
  getFontSize,
  getCommonStyles,
} from './theme';
import {ScreenSizeContext} from '../../context/screenSize';

interface PayForGiftCardProps {
  initiateResponse: InitiatePurchaseResponseData;
  onBack: () => void;
  onSuccess: (giftCard: GiftCard) => void;
}

export function PayForGiftCard({
  initiateResponse,
  onBack,
  onSuccess,
}: PayForGiftCardProps) {
  const {mutate: completePurchase, loading, error} = usePurchaseGiftCard();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const commonStyles = getCommonStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  console.log('initiateResponse');
  console.log(initiateResponse);

  const handleCompletePurchase = async () => {
    try {
      const giftCard = await completePurchase({
        brand: initiateResponse.brand,
        amount: initiateResponse.amount,
        currency: initiateResponse.currency,
      });
      onSuccess(giftCard);
    } catch {}
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={commonStyles.title}>Complete Payment</Text>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand</Text>
          <Text style={styles.detailValue}>{initiateResponse.brand}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>
            {initiateResponse.amount} {initiateResponse.currency}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Amount (LTC)</Text>
          <Text style={styles.detailValue}>
            {initiateResponse.paymentAmountLtc}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Address</Text>
          <Text style={[styles.detailValue, styles.addressText]}>
            {initiateResponse.paymentAddress}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expires At</Text>
          <Text style={styles.detailValue}>{initiateResponse.expiresAt}</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
        onPress={handleCompletePurchase}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={commonStyles.buttonText}>Complete Purchase</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      padding: getSpacing(screenHeight).md,
    },
    backButton: {
      marginBottom: getSpacing(screenHeight).md,
    },
    backButtonText: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.primary,
    },
    detailsCard: {
      backgroundColor: colors.white,
      borderRadius: getBorderRadius(screenHeight).md,
      padding: getSpacing(screenHeight).lg,
      marginBottom: getSpacing(screenHeight).lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: getSpacing(screenHeight).md,
    },
    detailLabel: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
      flex: 1,
    },
    detailValue: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.text,
      flex: 2,
      textAlign: 'right',
    },
    addressText: {
      fontSize: getFontSize(screenHeight).sm,
      fontFamily: 'monospace',
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
