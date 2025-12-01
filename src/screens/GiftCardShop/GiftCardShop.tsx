import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import type {StackNavigationOptions} from '@react-navigation/stack';
import {BrandGrid} from '../../components/GiftCardShop/BrandGrid';
import SignUpForm from '../../components/GiftCardShop/SignUpForm';
import {Brand} from '../../services/giftcards';
import {commonStyles} from '../../components/GiftCardShop/theme';
import {GiftCardClient} from '../../services/giftcards';
import {GiftCardProvider} from '../../components/GiftCardShop/hooks';

interface GiftCardShopProps {
  onSelectBrand?: (brand: Brand) => void;
}

const GiftCardShop: React.FC<GiftCardShopProps> = ({onSelectBrand}) => {
  const {uniqueId} = useSelector((state: any) => state.onboarding);
  const {account} = useSelector((state: any) => state.nexusshopaccount);
  const isLoggedIn = account && account.isLoggedIn;

  // Initialize client with uniqueId
  const client = useMemo(() => {
    return uniqueId ? new GiftCardClient(uniqueId) : null;
  }, [uniqueId]);

  const handleBrandSelect = (brand: Brand) => {
    if (__DEV__) {
      console.log('handleBrandSelect');
    }
    if (onSelectBrand) {
      onSelectBrand(brand);
    }
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      {!client ? (
        <SignUpForm />
      ) : (
        <GiftCardProvider client={client}>
          {isLoggedIn ? (
            <BrandGrid onSelectBrand={handleBrandSelect} />
          ) : (
            <SignUpForm />
          )}
        </GiftCardProvider>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const navigationOptions = (): StackNavigationOptions => ({
  title: 'Gift Card Shop',
  headerStyle: {
    backgroundColor: '#007AFF',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '700' as const,
  },
});

export default GiftCardShop;
