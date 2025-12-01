import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {Brand} from '../services/giftcards';

interface GiftCardCartItem {
  id: string;
  brand: Brand;
  amount: number;
  currency: string;
  quantity: number;
}

interface IGiftCardsCart {
  items: GiftCardCartItem[];
  loading: boolean;
  error: string | null;
  checkoutLoading: boolean;
}

const initialState: IGiftCardsCart = {
  items: [],
  loading: false,
  error: null,
  checkoutLoading: false,
};

export const giftCardsCartSlice = createSlice({
  name: 'giftcardscart',
  initialState,
  reducers: {
    setGiftCardsCartLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setGiftCardsCartError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.checkoutLoading = false;
    },
    setCheckoutLoading: (state, action: PayloadAction<boolean>) => {
      state.checkoutLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    addGiftCardToCart: (
      state,
      action: PayloadAction<{
        brand: Brand;
        amount: number;
        currency: string;
        quantity?: number;
      }>,
    ) => {
      const {brand, amount, currency, quantity = 1} = action.payload;
      const itemId = `${brand.slug}-${amount}-${currency}`;
      
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (existingItemIndex !== -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({
          id: itemId,
          brand,
          amount,
          currency,
          quantity,
        });
      }
      state.error = null;
    },
    removeGiftCardFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
    },
    updateGiftCardQuantity: (
      state,
      action: PayloadAction<{itemId: string; quantity: number}>,
    ) => {
      const {itemId, quantity} = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
      }
    },
    clearGiftCardsCart: state => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.checkoutLoading = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(createAction(PURGE), () => initialState);
  },
});

export const calculateCartTotal = (items: GiftCardCartItem[]) => {
  return items.reduce((total, item) => {
    return total + (item.amount * item.quantity);
  }, 0);
};

export const createBTCPayInvoice = 
  (items: GiftCardCartItem[], currency: string = 'USD') => 
  async (dispatch: any) => {
    try {
      dispatch(setCheckoutLoading(true));
      
      const totalAmount = calculateCartTotal(items);
      
      const response = await fetch('https://api.nexuswallet.com/btcpay/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: currency,
          items: items.map(item => ({
            id: item.id,
            brand: item.brand.name,
            amount: item.amount,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create BTCPay invoice: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch(setCheckoutLoading(false));
      
      return data.checkoutUrl;
    } catch (error) {
      dispatch(setGiftCardsCartError(error instanceof Error ? error.message : 'Failed to create checkout'));
      throw error;
    }
  };

export const {
  setGiftCardsCartLoading,
  setGiftCardsCartError,
  setCheckoutLoading,
  addGiftCardToCart,
  removeGiftCardFromCart,
  updateGiftCardQuantity,
  clearGiftCardsCart,
} = giftCardsCartSlice.actions;

export default giftCardsCartSlice.reducer;