import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppState} from 'react-native';
import {AppThunk} from './types';

import {authenticate} from '../utils/biometric';
import {unlockWallet} from './lightning';
import {resetSeedAction} from './onboarding';
import {getItem, setItem, resetItem} from '../utils/keychain';

// types
interface IAuthenticationState {
  passcode: string;
  passcodeSet: boolean;
  biometricsAvailable: any;
  biometricsEnabled: boolean;
  faceIDSupported: boolean;
  appState: any;
  failedLoginAttempts: number;
  timeLock: boolean;
  timeLockAt: number;
  dayLock: boolean;
  dayLockAt: number;
  permaLock: boolean;
  failedRecoverPinAttempts: number;
}

// initial state
const initialState = {
  passcode: '',
  passcodeSet: false,
  biometricsAvailable: null,
  biometricsEnabled: false,
  faceIDSupported: false,
  appState: null,
  failedLoginAttempts: 0,
  timeLock: false,
  timeLockAt: 0,
  dayLock: false,
  dayLockAt: 0,
  permaLock: false,
  failedRecoverPinAttempts: 0,
} as IAuthenticationState;

const MAX_LOGIN_ATTEMPTS = 10;
const TIME_LOCK_IN_SEC = 3600;
const DAY_LOCK_IN_SEC = 86400;

// actions
export const addUpRecoverPinFail = createAction(
  'authentication/addUpRecoverPinFailAction',
);
const addPasscodeAction = createAction<string>(
  'authentication/addPasscodeAction',
);
const resetPasscodeAction = createAction('authentication/resetPasscodeAction');
const lockWalletAction = createAction('authentication/lockWalletAction');
const timeLockWalletAction = createAction(
  'authentication/timeLockWalletAction',
);
const dayLockWalletAction = createAction('authentication/dayLockWalletAction');
const permaLockWalletAction = createAction(
  'authentication/permaLockWalletAction',
);
export const unlockWalletAction = createAction(
  'authentication/unlockWalletAction',
);
const setBiometricAvailabilityAction = createAction<{
  available: boolean;
  faceIDSupported: boolean;
}>('authentication/setBiometricAvailabilityAction');
const setBiometricEnabledAction = createAction<boolean>(
  'authentication/setBiometricEnabledAction',
);
const updateAppStateAction = createAction<any>(
  'authentication/updateAppStateAction',
);

// functions
export const addPincode =
  (passcode: string): AppThunk =>
  async dispatch => {
    await setItem('PINCODE', passcode);
    dispatch(addPasscodeAction(passcode));
  };

export const resetPincode = (): AppThunk => async dispatch => {
  await resetItem('PINCODE');
  dispatch(resetPasscodeAction());
};

export const resetSeed = (): AppThunk => async dispatch => {
  await resetItem('SEEDPHRASE');
  dispatch(resetSeedAction());
};

export const unlockWalletWithPin =
  (pincodeAttempt: any): AppThunk =>
  async (dispatch, getState) => {
    const {
      failedLoginAttempts,
      timeLock,
      timeLockAt,
      dayLock,
      dayLockAt,
      permaLock,
    } = getState().authentication!;

    const pincode = await getItem('PINCODE');

    // Case 1: Wallet is permanently locked, erase seed and pincode from both redux store and keychain
    if (permaLock || failedLoginAttempts === undefined) {
      await dispatch(resetSeed());
      await dispatch(resetPincode());
      throw new Error('Maxed out pin attempts. Recover with seed.');
    }

    // Case 2: Check if currently in a time or day lock state
    if (timeLock) {
      if (isLockExpired(timeLockAt, TIME_LOCK_IN_SEC)) {
        console.log('timelock expired');
      } else {
        const timeLeftInSec = calculateTimeLeft(timeLockAt, TIME_LOCK_IN_SEC);
        throw new Error(
          `Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`,
        );
      }
    }

    if (dayLock) {
      // Check if day lock has expired
      if (isLockExpired(dayLockAt, DAY_LOCK_IN_SEC)) {
        console.log('daylock expired');
      } else {
        const timeLeftInSec = calculateTimeLeft(dayLockAt, DAY_LOCK_IN_SEC);
        throw new Error(
          `Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`,
        );
      }
    }

    // Case 3: Check if PIN is correct
    if (pincodeAttempt !== pincode) {
      dispatch(handleFailedAttempt(failedLoginAttempts, timeLock, dayLock));
      return;
    }

    // Case 4: PIN is correct, unlock wallet
    dispatch(unlockWallet());
  };

/**
 * Helper function to handle failed login attempts
 */
const handleFailedAttempt =
  (failedLoginAttempts: any, timeLock: any, dayLock: any): AppThunk =>
  dispatch => {
    const nextAttemptCount = failedLoginAttempts + 1;

    if (nextAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      if (dayLock) {
        dispatch(permaLockWalletAction());
      } else if (timeLock) {
        dispatch(dayLockWalletAction());
      } else {
        dispatch(timeLockWalletAction());
      }
    } else {
      dispatch(lockWalletAction());
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

export const unlockWalletWithBiometric = (): AppThunk => async dispatch => {
  try {
    await authenticate('Unlock Wallet');
    dispatch(unlockWallet());
  } catch (error) {
    console.error(error);
  }
};

export const setBiometricAvailability =
  (available: any, faceIDSupported: any): AppThunk =>
  async dispatch => {
    dispatch(setBiometricAvailabilityAction({available, faceIDSupported}));
  };

export const setBiometricEnabled =
  (boolean: boolean): AppThunk =>
  dispatch => {
    dispatch(setBiometricEnabledAction(boolean));
  };

export const subscribeAppState = (): AppThunk => (dispatch, getState) => {
  AppState.addEventListener('change', nextAppState => {
    const {appState} = getState().authentication!;

    // when app goes into background for long periods of time
    // lnd may lock the user wallet
    // the central subscription in startLnd will update walletState in Redux
    if (nextAppState === 'active' && appState === 'background') {
      const {walletState} = getState().lightning;
      if (walletState !== null) {
        console.log('App resumed, wallet state:', walletState);
      }
    }

    dispatch(updateAppStateAction(nextAppState));
  });
};

export const authenticationSlice = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    addUpRecoverPinFailAction: state => ({
      ...state,
      failedRecoverPinAttempts: state.failedRecoverPinAttempts + 1,
    }),
    lockWalletAction: state => ({
      ...state,
      failedLoginAttempts:
        state.failedLoginAttempts === undefined
          ? 1
          : state.failedLoginAttempts + 1,
    }),
    timeLockWalletAction: state => ({
      ...state,
      timeLock: true,
      permaLock: false,
      failedLoginAttempts: 0,
      timeLockAt: Math.floor(Date.now() / 1000),
    }),
    dayLockWalletAction: state => ({
      ...state,
      dayLock: true,
      permaLock: false,
      failedLoginAttempts: 0,
      dayLockAt: Math.floor(Date.now() / 1000),
    }),
    permaLockWalletAction: state => ({
      ...state,
      permaLock: true,
      failedLoginAttempts: MAX_LOGIN_ATTEMPTS,
    }),
    unlockWalletAction: state => ({
      ...state,
      failedLoginAttempts: 0,
      timeLock: false,
      timeLockAt: 0,
      dayLock: false,
      dayLockAt: 0,
      permaLock: false,
    }),
    addPasscodeAction: (state, action: PayloadAction<string>) => ({
      ...state,
      passcode: action.payload,
      passcodeSet: true,
    }),
    resetPasscodeAction: state => ({
      ...state,
      passcode: '',
      passcodeSet: false,
    }),
    setBiometricAvailabilityAction: (state, action) => ({
      ...state,
      biometricsAvailable: action.payload.available,
      biometricsEnabled:
        state.biometricsEnabled === true && !action.payload.available
          ? false
          : state.biometricsEnabled,
      faceIDSupported: action.payload.faceIDSupported,
    }),
    setBiometricEnabledAction: (state, action: PayloadAction<boolean>) => ({
      ...state,
      biometricsEnabled: action.payload,
    }),
    updateAppStateAction: (state, action: PayloadAction<any>) => ({
      ...state,
      appState: action.payload,
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default authenticationSlice.reducer;
