import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {Cart} from '../services/shopify';

interface ICart {
  cart: Cart | null;
  cartId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ICart = {
  cart: null,
  cartId: null,
  loading: false,
  error: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setCartError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.cartId = action.payload.id;
      state.loading = false;
      state.error = null;
    },
    clearCart: state => {
      state.cart = null;
      state.cartId = null;
      state.loading = false;
      state.error = null;
    },
    updateCartQuantity: (
      state,
      action: PayloadAction<{lineId: string; quantity: number}>,
    ) => {
      if (state.cart) {
        const {lineId, quantity} = action.payload;
        const lineIndex = state.cart.lines.edges.findIndex(
          edge => edge.node.id === lineId,
        );
        if (lineIndex !== -1) {
          if (quantity <= 0) {
            // Remove the line if quantity is 0 or less
            state.cart.lines.edges.splice(lineIndex, 1);
          } else {
            state.cart.lines.edges[lineIndex].node.quantity = quantity;
          }
        }
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(createAction(PURGE), () => initialState);
  },
});

export const {
  setCartLoading,
  setCartError,
  setCart,
  clearCart,
  updateCartQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
