import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import BlueButton from '../../components/Buttons/BlueButton';
import TranslateText from '../../components/TranslateText';
import {
  removeGiftCardFromCart,
  updateGiftCardQuantity,
  calculateCartTotal,
  createBTCPayInvoice,
} from '../../reducers/giftcardcart';

interface GiftCardCartItem {
  id: string;
  brand: {
    name: string;
    slug: string;
    logoUrl?: string;
  };
  amount: number;
  currency: string;
  quantity: number;
}

const GiftCardCart: React.FC = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const {items, checkoutLoading, error} = useSelector(
    (state: any) => state.giftcardcart,
  );

  const totalAmount = calculateCartTotal(items);

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeGiftCardFromCart(itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    dispatch(updateGiftCardQuantity({itemId, quantity}));
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart first.');
      return;
    }

    try {
      const checkoutUrl = await dispatch(createBTCPayInvoice(items) as any);

      if (checkoutUrl) {
        // TODO: Navigate to web view or handle checkout URL
        Alert.alert('Checkout', `Redirecting to: ${checkoutUrl}`);
      }
    } catch {
      Alert.alert(
        'Checkout Error',
        'Failed to create checkout. Please try again.',
      );
    }
  };

  const renderCartItem = ({item}: {item: GiftCardCartItem}) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        {item.brand.logoUrl && (
          <Image source={{uri: item.brand.logoUrl}} style={styles.brandLogo} />
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.brandName}>{item.brand.name}</Text>
          <Text style={styles.itemAmount}>
            {item.currency} {item.amount}
          </Text>
        </View>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.quantity}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}>
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyCart}>
      <Text style={styles.emptyCartText}>Your cart is empty</Text>
      <Text style={styles.emptyCartSubtext}>
        Add some gift cards to get started!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <View style={styles.header}>
        <TranslateText
          textValue="Gift Card Cart"
          textStyle={styles.headerTitle}
        />
      </View>

      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                USD {totalAmount.toFixed(2)}
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <BlueButton
              textKey="preview_purchase"
              textDomain="buyTab"
              onPress={handleCheckout}
              disabled={checkoutLoading || items.length === 0}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E2E2E',
    textAlign: 'center',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 14,
    color: '#747E87',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C72FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E2E2E',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#20BB74',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E2E2E',
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#747E87',
    textAlign: 'center',
  },
});

export default GiftCardCart;
