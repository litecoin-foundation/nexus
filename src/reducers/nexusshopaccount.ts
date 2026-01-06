import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {GiftCard, GiftCardInApp, Brand} from '../services/giftcards';
import {Platform} from 'react-native';
import {getCountry} from 'react-native-localize';
import * as SecureStore from 'expo-secure-store';

interface UserAccount {
  email: string;
  uniqueId: string;
  isLoggedIn: boolean;
  registrationDate: number;
}

interface INexusShopAccount {
  account: UserAccount | null;
  giftCards: GiftCardInApp[];
  wishlistBrands: Brand[];
  loading: boolean;
  error: string | null;
  loginLoading: boolean;
}

const initialState: INexusShopAccount = {
  account: null,
  giftCards: [],
  wishlistBrands: [],
  loading: false,
  error: null,
  loginLoading: false,
};

const BASE_API_URL = __DEV__
  ? 'http://mylocalip:3000'
  : 'https://api.nexuswallet.com';

export const nexusShopAccountSlice = createSlice({
  name: 'nexusshopaccount',
  initialState,
  reducers: {
    setAccountLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setLoginLoading: (state, action: PayloadAction<boolean>) => {
      state.loginLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setAccountError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.loginLoading = false;
    },
    setAccount: (state, action: PayloadAction<UserAccount>) => {
      state.account = action.payload;
      state.loading = false;
      state.loginLoading = false;
      state.error = null;
    },
    clearAccount: state => {
      state.account = null;
      state.giftCards = [];
      state.wishlistBrands = [];
      state.loading = false;
      state.loginLoading = false;
      state.error = null;
    },
    resetWishlist: state => {
      state.wishlistBrands = [];
    },
    setGiftCards: (state, action: PayloadAction<GiftCardInApp[]>) => {
      state.giftCards = action.payload;
      state.loading = false;
      state.error = null;
    },
    addGiftCard: (state, action: PayloadAction<GiftCardInApp>) => {
      const existingIndex = state.giftCards.findIndex(
        card => card.id === action.payload.id,
      );
      if (existingIndex !== -1) {
        state.giftCards[existingIndex] = action.payload;
      } else {
        state.giftCards.push(action.payload);
      }
    },
    updateGiftCardStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: 'active' | 'redeemed' | 'cancelled' | 'expired';
      }>,
    ) => {
      const {id, status} = action.payload;
      const giftCard = state.giftCards.find(card => card.id === id);
      if (giftCard) {
        giftCard.status = status;
      }
    },
    removeGiftCard: (state, action: PayloadAction<string>) => {
      state.giftCards = state.giftCards.filter(
        card => card.id !== action.payload,
      );
    },
    markAsFavoured: (state, action: PayloadAction<string>) => {
      const giftCard = state.giftCards.find(card => card.id === action.payload);
      if (giftCard) {
        giftCard.favoured = !giftCard.favoured;
      }
    },
    addToWishlist: (state, action: PayloadAction<Brand>) => {
      const existingIndex = state.wishlistBrands.findIndex(
        brand => brand.slug === action.payload.slug,
      );
      if (existingIndex === -1) {
        state.wishlistBrands.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.wishlistBrands = state.wishlistBrands.filter(
        brand => brand.slug !== action.payload,
      );
    },
    toggleWishlistBrand: (state, action: PayloadAction<Brand>) => {
      const existingIndex = state.wishlistBrands.findIndex(
        brand => brand.slug === action.payload.slug,
      );
      if (existingIndex !== -1) {
        state.wishlistBrands.splice(existingIndex, 1);
      } else {
        state.wishlistBrands.push(action.payload);
      }
    },
    verifyOtpSuccess: state => {
      if (state.account) {
        state.account.isLoggedIn = true;
      }
      state.loading = false;
      state.loginLoading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(createAction(PURGE), () => initialState);
  },
});

export const registerOnNexusShop =
  (email: string, uniqueId: string) => async (dispatch: any, getState: any) => {
    const {deviceNotificationToken, currencyCode, languageCode} =
      getState().settings!;

    try {
      dispatch(setLoginLoading(true));

      const response = await fetch(`${BASE_API_URL}/api/shop/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          uniqueId,
          deviceToken: deviceNotificationToken,
          isIOS: Platform.OS === 'ios',
          countryCode: getCountry(),
          currencyCode: currencyCode,
          language: languageCode,
          osVersion: String(Platform.Version),
        }),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }
      await response.json();

      const userAccount: UserAccount = {
        email,
        uniqueId,
        isLoggedIn: false,
        registrationDate: Math.floor(Date.now() / 1000),
      };

      dispatch(setAccount(userAccount));
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Registration failed',
        ),
      );
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

export const loginToNexusShop =
  (email: string) => async (dispatch: any, getState: any) => {
    try {
      dispatch(setLoginLoading(true));

      const resSendOtp = await fetch(`${BASE_API_URL}/api/shop/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!resSendOtp.ok) {
        throw new Error(`Login failed: ${resSendOtp.statusText}`);
      }
      await resSendOtp.json();
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Login failed',
        ),
      );
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

export const verifyOtpCode =
  (email: string, uniqueId: string, otpCode: string) =>
  async (dispatch: any) => {
    try {
      dispatch(setLoginLoading(true));

      const response = await fetch(`${BASE_API_URL}/api/shop/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          uniqueId,
          otpCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`OTP verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      const {session} = data.data;

      if (session) {
        await SecureStore.setItemAsync('sessionToken', session);
      }

      dispatch(verifyOtpSuccess());
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'OTP verification failed',
        ),
      );
    }
  };

export const loginToNexusShopTest =
  (email: string, uniqueId: string) => async (dispatch: any) => {
    try {
      dispatch(setLoginLoading(true));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userAccount: UserAccount = {
        email,
        uniqueId,
        isLoggedIn: false,
        registrationDate: Math.floor(Date.now() / 1000),
      };

      dispatch(setAccount(userAccount));
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Login failed',
        ),
      );
    }
  };

export const verifyOtpCodeTest =
  (email: string, uniqueId: string, otpCode: string) =>
  async (dispatch: any) => {
    try {
      dispatch(setLoginLoading(true));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simple test validation - accept any 6-digit code
      if (otpCode.length === 6 && /^\d+$/.test(otpCode)) {
        dispatch(verifyOtpSuccess());
      } else {
        throw new Error('Invalid OTP code. Please enter a 6-digit code.');
      }
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'OTP verification failed',
        ),
      );
    }
  };

export const fetchUserGiftCards =
  (uniqueId: string) => async (dispatch: any) => {
    try {
      dispatch(setAccountLoading(true));

      const response = await fetch(
        `${BASE_API_URL}/shop/giftcards/${uniqueId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${uniqueId}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch gift cards: ${response.statusText}`);
      }

      const giftCards: GiftCard[] = await response.json();
      const giftCardsWithFavoured: GiftCardInApp[] = giftCards.map(card => ({
        ...card,
        favoured: false,
      }));
      dispatch(setGiftCards(giftCardsWithFavoured));
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Failed to fetch gift cards',
        ),
      );
    }
  };

export const {
  setAccountLoading,
  setLoginLoading,
  setAccountError,
  setAccount,
  clearAccount,
  resetWishlist,
  setGiftCards,
  addGiftCard,
  updateGiftCardStatus,
  removeGiftCard,
  markAsFavoured,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistBrand,
  verifyOtpSuccess,
} = nexusShopAccountSlice.actions;

export default nexusShopAccountSlice.reducer;
