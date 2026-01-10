import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {GiftCard, GiftCardInApp, Brand} from '../services/giftcards';
import {Platform} from 'react-native';
import {getCountry} from 'react-native-localize';
import * as SecureStore from 'expo-secure-store';
import {AppThunk} from './types';

interface IUserAccount {
  email: string;
  uniqueId: string;
  isLoggedIn: boolean;
  registrationDate: number;
}

interface INexusShopAccount {
  account: IUserAccount | null;
  giftCards: GiftCardInApp[];
  wishlistBrands: Brand[];
  loading: boolean;
  error: string | null;
  loginLoading: boolean;
  failedLoginAttempts: number;
  timeLock: boolean;
  timeLockAt: number;
}

const initialState: INexusShopAccount = {
  account: null,
  giftCards: [],
  wishlistBrands: [],
  loading: false,
  error: null,
  loginLoading: false,
  failedLoginAttempts: 0,
  timeLock: false,
  timeLockAt: 0,
};

const MAX_LOGIN_ATTEMPTS = 3;
const TIME_LOCK_IN_SEC = 900;

const BASE_API_URL = __DEV__
  ? 'https://stage-api.nexuswallet.com'
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
    setAccount: (state, action: PayloadAction<IUserAccount>) => {
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
    resetAccount: state => {
      state.account = null;
      state.giftCards = [];
      state.wishlistBrands = [];
      state.loading = false;
      state.loginLoading = false;
      state.error = null;
      state.failedLoginAttempts = 0;
      state.timeLock = false;
      state.timeLockAt = 0;
    },
    addFailedLoginAttempt: state => {
      state.failedLoginAttempts =
        state.failedLoginAttempts === undefined
          ? 1
          : state.failedLoginAttempts + 1;
    },
    timeLockNSAccount: state => {
      state.failedLoginAttempts = 0;
      state.timeLock = true;
      state.timeLockAt = Math.floor(Date.now() / 1000);
      // state.account = null;
      // state.giftCards = [];
      // state.wishlistBrands = [];
      // state.loading = false;
      // state.loginLoading = false;
      // state.error = null;
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

/**
 * Handle failed login attempts
 */
const handleFailedAttempt =
  (failedLoginAttempts: any): AppThunk =>
  dispatch => {
    const nextAttemptCount = failedLoginAttempts + 1;

    if (nextAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      dispatch(timeLockNSAccount());
    } else {
      dispatch(addFailedLoginAttempt());
    }
  };

/**
 * Check if a lock period has expired
 */
const isLockExpired = (lockTime: any, lockDuration: any) => {
  return Number(lockTime || 0) + lockDuration < Math.floor(Date.now() / 1000);
};

/**
 * Calculate time left in a lock period
 */
const calculateTimeLeft = (lockTime: any, lockDuration: any) => {
  return lockDuration - (Math.floor(Date.now() / 1000) - lockTime);
};

export const resetFromNexusShop = () => async (dispatch: any) => {
  await SecureStore.deleteItemAsync('sessionToken');
  dispatch(resetAccount());
};
export const logoutFromNexusShop = () => async (dispatch: any) => {
  await SecureStore.deleteItemAsync('sessionToken');
  dispatch(clearAccount());
};

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const userAccount: IUserAccount = {
        email,
        uniqueId,
        isLoggedIn: false,
        registrationDate: Math.floor(Date.now() / 1000),
      };

      dispatch(setAccount(userAccount));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'An account with this email already exists. Please sign in instead.'
      ) {
        const userAccount: IUserAccount = {
          email,
          uniqueId,
          isLoggedIn: false,
          registrationDate: Math.floor(Date.now() / 1000),
        };
        dispatch(setAccount(userAccount));
        await dispatch(loginToNexusShop(email));
      } else {
        dispatch(
          setAccountError(
            error instanceof Error ? error.message : 'Registration failed',
          ),
        );
        throw error;
      }
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

const loginToNexusShop =
  (email: string): AppThunk =>
  async (dispatch, getState) => {
    const {timeLock, timeLockAt} = getState().nexusshopaccount!;

    try {
      dispatch(setLoginLoading(true));

      // Maxed out login attempts
      if (timeLock) {
        if (isLockExpired(timeLockAt, TIME_LOCK_IN_SEC)) {
          if (__DEV__) {
            console.log('NS Account timelock expired');
          }
        } else {
          const timeLeftInSec = calculateTimeLeft(timeLockAt, TIME_LOCK_IN_SEC);
          throw new Error(
            `Maxed out login attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`,
          );
        }
      }

      const response = await fetch(`${BASE_API_URL}/api/shop/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Login failed',
        ),
      );
      /**
       * If loginToNexusShop threw, it would propagate to SignUp.tsx and show "Sign Up Failed",
       * but sign-up didn't fail, just OTP sending.
       */
      // throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

/**
 * It is imperative to not setLoginLoading from this function
 * since it operates in a separate screen, whilst setLoginLoading
 * rerenders other NexusShopStack screens causing app to crash.
 */
export const verifyOtpCode =
  (
    email: string,
    uniqueId: string,
    otpCode: string,
    signal?: AbortSignal,
  ): AppThunk =>
  async (dispatch, getState) => {
    const {failedLoginAttempts, timeLock, timeLockAt} =
      getState().nexusshopaccount!;

    try {
      // Maxed out code verification attempts
      if (timeLock) {
        if (isLockExpired(timeLockAt, TIME_LOCK_IN_SEC)) {
          if (__DEV__) {
            console.log('NS Account timelock expired');
          }
        } else {
          const timeLeftInSec = calculateTimeLeft(timeLockAt, TIME_LOCK_IN_SEC);
          throw new Error(
            `Maxed out code verification attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`,
          );
        }
      }

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
        signal,
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch(handleFailedAttempt(failedLoginAttempts));
        throw new Error(data.error || 'OTP verification failed');
      }

      const {session} = data.data;

      if (session) {
        await SecureStore.setItemAsync('sessionToken', session);
      }

      dispatch(verifyOtpSuccess());
    } catch (error) {
      // Don't dispatch error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'OTP verification failed',
        ),
      );
      throw error;
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gift cards');
      }

      const giftCards: GiftCard[] = data;
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
  resetAccount,
  timeLockNSAccount,
  addFailedLoginAttempt,
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
