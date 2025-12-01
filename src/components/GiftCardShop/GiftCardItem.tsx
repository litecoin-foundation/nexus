import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  GiftCard,
  isExpired,
  daysUntilExpiration,
} from '../../services/giftcards';
import {useRedeemGiftCard} from './hooks';
import {colors, spacing, borderRadius, fontSize, commonStyles} from './theme';

interface GiftCardItemProps {
  giftCard: GiftCard;
  onPress?: () => void;
  onUpdate: () => void;
}

export function GiftCardItem({giftCard, onPress, onUpdate}: GiftCardItemProps) {
  const [expanded, setExpanded] = useState(false);
  const {mutate: redeem, loading: redeeming} = useRedeemGiftCard();

  const expired = isExpired(giftCard);
  const daysLeft = daysUntilExpiration(giftCard);

  const handleRedeem = async () => {
    try {
      await redeem(giftCard.id);
      onUpdate();
      Alert.alert('Success', 'Gift card marked as redeemed');
    } catch {
      Alert.alert('Error', 'Failed to mark gift card as redeemed');
    }
  };

  const openUrl = () => {
    if (giftCard.redeemUrl) {
      Linking.openURL(giftCard.redeemUrl);
    }
  };

  const copyCode = () => {
    if (giftCard.redeemCode) {
      Clipboard.setString(giftCard.redeemCode);
      Alert.alert('Copied!', 'Gift card code copied to clipboard');
    }
  };

  const getStatusBadgeStyle = () => {
    if (expired)
      return {
        container: commonStyles.badgeExpired,
        text: commonStyles.badgeExpiredText,
      };
    switch (giftCard.status) {
      case 'active':
        return {
          container: commonStyles.badgeActive,
          text: commonStyles.badgeActiveText,
        };
      case 'redeemed':
        return {
          container: commonStyles.badgeRedeemed,
          text: commonStyles.badgeRedeemedText,
        };
      default:
        return {
          container: commonStyles.badgeRedeemed,
          text: commonStyles.badgeRedeemedText,
        };
    }
  };

  const badgeStyle = getStatusBadgeStyle();

  return (
    <TouchableOpacity
      style={commonStyles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}>
      <View style={commonStyles.spaceBetween}>
        <View>
          <Text style={styles.cardBrandName}>{giftCard.brand}</Text>
          <Text style={styles.cardAmount}>{giftCard.faceValue.amount}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <View style={[commonStyles.badge, badgeStyle.container]}>
            <Text style={badgeStyle.text}>
              {expired ? 'EXPIRED' : giftCard.status.toUpperCase()}
            </Text>
          </View>
          {!expired && giftCard.status === 'active' && daysLeft <= 30 && (
            <Text
              style={[
                commonStyles.caption,
                {color: colors.warning, marginTop: spacing.xs},
              ]}>
              {daysLeft} days left
            </Text>
          )}
        </View>
      </View>

      {expanded && (
        <View style={styles.cardDetails}>
          <View style={commonStyles.divider} />

          {giftCard.redeemUrl && (
            <TouchableOpacity style={styles.detailButton} onPress={openUrl}>
              <Text style={styles.detailButtonText}>View Gift Card →</Text>
            </TouchableOpacity>
          )}

          {giftCard.redeemCode && (
            <View style={styles.codeSection}>
              <Text style={commonStyles.label}>Code</Text>
              <View style={commonStyles.row}>
                <Text style={styles.detailCode}>{giftCard.redeemCode}</Text>
                <TouchableOpacity
                  onPress={copyCode}
                  style={styles.copySmallButton}>
                  <Text style={styles.copySmallText}>Copy</Text>
                </TouchableOpacity>
              </View>
              {giftCard.pin && (
                <View style={{marginTop: spacing.sm}}>
                  <Text style={commonStyles.label}>PIN</Text>
                  <Text style={styles.detailCode}>{giftCard.pin}</Text>
                </View>
              )}
            </View>
          )}

          <Text style={commonStyles.caption}>
            Purchased: {new Date(giftCard.purchasedAt).toLocaleDateString()}
          </Text>
          <Text style={commonStyles.caption}>
            Expires: {new Date(giftCard.expirationDate).toLocaleDateString()}
          </Text>

          {giftCard.status === 'active' && !expired && (
            <TouchableOpacity
              style={[styles.markRedeemedButton, redeeming && {opacity: 0.5}]}
              onPress={handleRedeem}
              disabled={redeeming}>
              <Text style={styles.markRedeemedText}>
                {redeeming ? 'Updating...' : 'Mark as Redeemed'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardBrandName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  cardAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.xs,
  },
  cardDetails: {
    marginTop: spacing.md,
  },
  detailButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  detailButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  codeSection: {
    backgroundColor: colors.grayLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  detailCode: {
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  copySmallButton: {
    marginLeft: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.grayMedium,
    borderRadius: borderRadius.sm,
  },
  copySmallText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  markRedeemedButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  markRedeemedText: {
    color: colors.white,
    fontWeight: '600',
  },
});
