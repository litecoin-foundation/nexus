import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE, REHYDRATE} from 'redux-persist';
import {Platform} from 'react-native';
import {getCountry} from 'react-native-localize';
import * as SecureStore from 'expo-secure-store';

import {
  GiftCard,
  GiftCardInApp,
  Brand,
  createGiftCardClient,
} from '../services/giftcards';
import {TURNSTILE_RESPONSE_FIELD} from '../components/turnstileConfig';
import {AppThunk} from './types';

interface IUserAccount {
  email: string;
  uniqueId: string;
  isLoggedIn: boolean;
  registrationDate: number;
  userCountry: string;
  userCurrency: string;
}

interface INexusShopAccount {
  account: IUserAccount | null;
  giftCards: GiftCardInApp[];
  wishlistBrands: Brand[];
  loading: boolean;
  error: string | null;
  loginLoading: boolean;
  isCountryPickerOpen: boolean;
  tosAgreed: boolean;
}

const initialState: INexusShopAccount = {
  account: null,
  giftCards: [],
  wishlistBrands: [],
  loading: false,
  error: null,
  loginLoading: false,
  isCountryPickerOpen: false,
  tosAgreed: false,
};

// Root-level REHYDRATE: the payload is the whole persisted tree, keyed by slice.
const rehydrate = createAction<
  {nexusshopaccount?: INexusShopAccount} | undefined
>(REHYDRATE);

const BASE_API_URL = __DEV__
  ? 'https://stage-api.nexuswallet.com'
  : 'https://api.nexuswallet.com';

const REQUEST_TIMEOUT_MS = 15000;

/**
 * fetch() has no default timeout. Against an unreachable host the promise stays
 * pending until the platform gives up (60s on iOS, longer if the connection
 * hangs rather than refuses), so the `finally` that clears loginLoading never
 * runs and the button sits spinning. Bound every request instead.
 *
 * An abort from the caller's own signal is rethrown untouched, so unmount
 * cancellation stays distinguishable from a timeout.
 */
const fetchWithTimeout = async (
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const external = init.signal;
  const forwardAbort = () => controller.abort();
  external?.addEventListener('abort', forwardAbort);

  try {
    return await fetch(url, {...init, signal: controller.signal});
  } catch (error) {
    if (timedOut) {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    external?.removeEventListener('abort', forwardAbort);
  }
};

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
      state.tosAgreed = false;
    },
    resetAccount: state => {
      state.account = null;
      state.giftCards = [];
      state.wishlistBrands = [];
      state.loading = false;
      state.loginLoading = false;
      state.error = null;
      state.tosAgreed = false;
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
    setWishlistBrands: (state, action: PayloadAction<Brand[]>) => {
      state.wishlistBrands = action.payload;
    },
    setUserCurrency: (state, action: PayloadAction<string>) => {
      if (state.account) {
        state.account.userCurrency = action.payload;
      }
    },
    setUserCountry: (state, action: PayloadAction<string>) => {
      if (state.account) {
        state.account.userCountry = action.payload;
      }
    },
    setCountryPickerOpen: (state, action: PayloadAction<boolean>) => {
      state.isCountryPickerOpen = action.payload;
    },
    setTosAgreed: (state, action: PayloadAction<boolean>) => {
      state.tosAgreed = action.payload;
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
    // The whole store is persisted, transient flags included. Killing the app
    // mid-request writes loginLoading: true to disk with nothing left to unset
    // it, permanently disabling the sign-up button; a stale error would pop a
    // warning modal on launch. Reset them as the slice comes back.
    //
    // The merge has to be done here rather than left to the reconciler:
    // autoMergeLevel1 skips any key the reducer already touched, so returning a
    // new object means this is the only chance to apply the persisted values.
    builder.addCase(rehydrate, (state, action) => {
      const inbound = action.payload?.nexusshopaccount;
      if (!inbound) return state;
      return {
        ...state,
        ...inbound,
        loading: false,
        loginLoading: false,
        error: null,
        isCountryPickerOpen: false,
      };
    });
  },
});

export const resetFromNexusShop = () => async (dispatch: any) => {
  await SecureStore.deleteItemAsync('sessionToken');
  dispatch(resetAccount());
};

export const logoutFromNexusShop = () => async (dispatch: any) => {
  await SecureStore.deleteItemAsync('sessionToken');
  dispatch(clearAccount());
};

export const clearSessionToken = (): AppThunk => async (dispatch, getState) => {
  const {account} = getState().nexusshopaccount!;
  if (!account?.isLoggedIn) await SecureStore.deleteItemAsync('sessionToken');
};

export const registerOnNexusShop =
  (email: string, uniqueId: string, turnstileToken: string) =>
  async (dispatch: any, getState: any) => {
    const {deviceNotificationToken, currencyCode, languageCode} =
      getState().settings!;

    try {
      dispatch(setLoginLoading(true));

      const body = JSON.stringify({
        email,
        uniqueId,
        [TURNSTILE_RESPONSE_FIELD]: turnstileToken,
        deviceToken: deviceNotificationToken,
        isIOS: Platform.OS === 'ios',
        countryCode: getCountry(),
        currencyCode: currencyCode,
        language: languageCode,
        osVersion: String(Platform.Version),
      });

      const response = await fetchWithTimeout(
        `${BASE_API_URL}/api/shop/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle turnstile validation failure (403)
        if (response.status === 403) {
          throw new Error(
            data.error || 'Verification failed. Please try again.',
          );
        }
        throw new Error(data.error || 'Registration failed');
      }

      const userAccount: IUserAccount = {
        email,
        uniqueId,
        isLoggedIn: false,
        registrationDate: Math.floor(Date.now() / 1000),
        userCountry: getCountry(),
        userCurrency: currencyCode,
      };

      dispatch(setAccount(userAccount));
    } catch (error) {
      dispatch(
        setAccountError(
          error instanceof Error ? error.message : 'Registration failed',
        ),
      );
      throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

export const loginToNexusShop =
  (email: string, turnstileToken: string): AppThunk =>
  async dispatch => {
    try {
      dispatch(setLoginLoading(true));

      const response = await fetchWithTimeout(
        `${BASE_API_URL}/api/shop/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            [TURNSTILE_RESPONSE_FIELD]: turnstileToken,
          }),
        },
      );

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
  async dispatch => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_API_URL}/api/shop/verify-otp`,
        {
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
        },
      );

      const data = await response.json();

      if (!response.ok) {
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

export const fetchWishlistFromServer =
  (availableBrands: Brand[]): AppThunk =>
  async dispatch => {
    try {
      const client = createGiftCardClient();
      const slugs = await client.getWishlist();
      const brandMap = new Map(availableBrands.map(b => [b.slug, b]));
      const brands = slugs
        .map(slug => brandMap.get(slug))
        .filter((b): b is Brand => b !== undefined);
      dispatch(setWishlistBrands(brands));
    } catch (error) {
      console.warn('Failed to fetch wishlist from server:', error);
    }
  };

export const syncWishlistToggle =
  (brand: Brand): AppThunk =>
  async (dispatch, getState) => {
    const {wishlistBrands} = getState().nexusshopaccount!;
    const isCurrentlyInWishlist = wishlistBrands.some(
      b => b.slug === brand.slug,
    );

    dispatch(toggleWishlistBrand(brand));

    try {
      const client = createGiftCardClient();
      if (isCurrentlyInWishlist) {
        await client.removeFromWishlist(brand.slug);
      } else {
        await client.addToWishlist(brand.slug);
      }
    } catch (error) {
      // Revert on failure
      dispatch(toggleWishlistBrand(brand));
      console.warn('Failed to sync wishlist:', error);
    }
  };

export const fetchUserGiftCards =
  (uniqueId: string) => async (dispatch: any) => {
    try {
      dispatch(setAccountLoading(true));

      const response = await fetchWithTimeout(
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
  resetWishlist,
  setGiftCards,
  addGiftCard,
  updateGiftCardStatus,
  removeGiftCard,
  markAsFavoured,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistBrand,
  setWishlistBrands,
  setUserCurrency,
  setUserCountry,
  setCountryPickerOpen,
  setTosAgreed,
  verifyOtpSuccess,
} = nexusShopAccountSlice.actions;

export default nexusShopAccountSlice.reducer;
