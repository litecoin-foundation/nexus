import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Brand, GiftCard} from '../../services/giftcards';
import {colors, spacing, fontSize, commonStyles} from './theme';
import {BrandGrid} from './BrandGrid';
import {PurchaseForm} from './PurchaseForm';
import {PurchaseSuccess} from './PurchaseSuccess';
import {MyGiftCards} from './MyGiftCards';

type ScreenState =
  | {type: 'browse'}
  | {type: 'purchase'; brand: Brand}
  | {type: 'success'; brand: Brand; giftCard: GiftCard}
  | {type: 'my-cards'};

export function GiftCardScreen() {
  const [screen, setScreen] = useState<ScreenState>({type: 'browse'});

  const handleSelectBrand = (brand: Brand) => {
    setScreen({type: 'purchase', brand});
  };

  const handlePurchaseSuccess = (giftCard: GiftCard) => {
    if (screen.type === 'purchase') {
      setScreen({type: 'success', brand: screen.brand, giftCard});
    }
  };

  const handleDone = () => {
    setScreen({type: 'browse'});
  };

  const handleBack = () => {
    setScreen({type: 'browse'});
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gift Cards</Text>
        <TouchableOpacity
          onPress={() =>
            setScreen(
              screen.type === 'my-cards'
                ? {type: 'browse'}
                : {type: 'my-cards'},
            )
          }>
          <Text style={styles.headerButton}>
            {screen.type === 'my-cards' ? 'Browse' : 'My Cards'}
          </Text>
        </TouchableOpacity>
      </View>

      {screen.type === 'browse' && (
        <BrandGrid onSelectBrand={handleSelectBrand} />
      )}

      {screen.type === 'purchase' && (
        <PurchaseForm
          brand={screen.brand}
          onBack={handleBack}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {screen.type === 'success' && (
        <PurchaseSuccess
          brand={screen.brand}
          giftCard={screen.giftCard}
          onDone={handleDone}
        />
      )}

      {screen.type === 'my-cards' && <MyGiftCards />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
});
