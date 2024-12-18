import {AppState} from 'react-native';
import {subscribeState} from 'react-native-turbo-lnd';
import {WalletState} from 'react-native-turbo-lnd/protos/lightning_pb';

import {authenticate} from '../lib/utils/biometric';
import {unlockWallet} from './lightning';
import {getItem, setItem, resetItem} from '../lib/utils/keychain';

// initial state
const initialState = {
  passcode: '',
  passcodeSet: false,
  walletUnlocked: null,
  biometricsAvailable: null,
  biometricsEnabled: false,
  faceIDSupported: false,
  timeLastUnlocked: null,
  appState: null,
  failedLoginAttempts: 0,
  timeLock: false,
  timeLockAt: 0,
  dayLock: false,
  dayLockAt: 0,
  permaLock: false,
};

const MAX_LOGIN_ATTEMPTS = 10;
const TIME_LOCK_IN_SEC = 3600;
const DAY_LOCK_IN_SEC = 86400;

// constants
export const ADD_PASSCODE = 'ADD_PASSCODE';
export const RESET_PASSCODE = 'RESET_PASSCODE';
export const LOCK_WALLET = 'LOCK_WALLET';
export const TIME_LOCK_WALLET = 'TIME_LOCK_WALLET';
export const DAY_LOCK_WALLET = 'DAY_LOCK_WALLET';
export const PERMA_LOCK_WALLET = 'PERMA_LOCK_WALLET';
export const UNLOCK_WALLET = 'UNLOCK_WALLET';
export const CLEAR_UNLOCK = 'CLEAR_UNLOCK';
export const SET_BIOMETRIC_AVAILABILITY = 'SET_BIOMETRIC_AVAILABILITY';
export const SET_BIOMETRIC_ENABLED = 'SET_BIOMETRIC_ENABLED';
export const UPDATE_APP_STATE = 'UPDATE_APP_STATE';

// actions
export const addPincode = passcode => async dispatch => {
  await setItem('PINCODE', passcode);

  dispatch({
    type: ADD_PASSCODE,
    passcode,
  });
};

export const resetPincode = () => async dispatch => {
  await resetItem('PINCODE');

  dispatch({
    type: RESET_PASSCODE,
  });
};

export const unlockWalletWithPin = pincodeAttempt => async (dispatch, getState) => {
  const {failedLoginAttempts, timeLock, timeLockAt, dayLock, dayLockAt, permaLock} = getState().authentication;

  const pincode = await getItem('PINCODE');

  if (failedLoginAttempts === undefined || !permaLock) {
    if (pincodeAttempt !== pincode) {
      if (failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        if (dayLock) {
          dispatch({
            type: PERMA_LOCK_WALLET,
          });
        } else if (timeLock) {
          dispatch({
            type: DAY_LOCK_WALLET,
          });
        } else {
          dispatch({
            type: TIME_LOCK_WALLET,
          });
        }
      } else {
        if (dayLock) {
          if (Number(dayLockAt || 0) + DAY_LOCK_IN_SEC < Math.floor(Date.now() / 1000)) {
            dispatch({
              type: LOCK_WALLET,
            });
          } else {
            const timeLeftInSec = DAY_LOCK_IN_SEC - (Math.floor(Date.now() / 1000) - dayLockAt);
            // console.log(`Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`);
            throw new Error(`Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`);
          }
        } else if (timeLock) {
          if (Number(timeLockAt || 0) + TIME_LOCK_IN_SEC < Math.floor(Date.now() / 1000)) {
            dispatch({
              type: LOCK_WALLET,
            });
          } else {
            const timeLeftInSec = TIME_LOCK_IN_SEC - (Math.floor(Date.now() / 1000) - timeLockAt);
            // console.log(`Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`);
            throw new Error(`Maxed out pin attempts. Try again in ${Math.ceil(timeLeftInSec / 60)} minutes.`);
          }
        } else {
          dispatch({
            type: LOCK_WALLET,
          });
        }
      }
    } else {
      dispatch(unlockWallet());

      subscribeState(
        {},
        async state => {
          try {
            if (state.state === WalletState.UNLOCKED) {
              dispatch({
                type: UNLOCK_WALLET,
              });
            }
          } catch (error) {
            throw new Error(String(error));
          }
        },
        error => {
          console.error(error);
        },
      );
    }
  } else {
    // console.log('Maxed out pin attempts. Recover with seed.');
    throw new Error('Maxed out pin attempts. Recover with seed.');
  }
};

export const unlockWalletWithBiometric = () => async dispatch => {
  try {
    await authenticate('Unlock Wallet');
    dispatch(unlockWallet());

    subscribeState(
      {},
      async state => {
        try {
          if (state.state === WalletState.UNLOCKED) {
            dispatch({
              type: UNLOCK_WALLET,
            });
          }
        } catch (error) {
          throw new Error(String(error));
        }
      },
      error => {
        console.error(error);
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const clearWalletUnlocked = () => dispatch => {
  dispatch({
    type: CLEAR_UNLOCK,
  });
};

export const setBiometricAvailability =
  (available, faceIDSupported) => dispatch => {
    dispatch({
      type: SET_BIOMETRIC_AVAILABILITY,
      available,
      faceIDSupported,
    });
  };

export const setBiometricEnabled = boolean => dispatch => {
  dispatch({
    type: SET_BIOMETRIC_ENABLED,
    boolean,
  });
};

export const subscribeAppState = () => (dispatch, getState) => {
  AppState.addEventListener('change', nextAppState => {
    const {appState} = getState().authentication;

    // when app goes into background for long periods of time
    // lnd may lock the user wallet
    // present an authentication screen if wallet locked
    if (nextAppState === 'active' && appState === 'background') {
      subscribeState(
        {},
        async state => {
          try {
            if (state === WalletState.LOCKED) {
              // TODO: handle lnd locking in background, by present Auth Screen!
              console.warn('bg: user wallet locked!');
            }
          } catch (error) {
            throw new Error(String(error));
          }
        },
        error => {
          console.error(error);
        },
      );
    }

    dispatch({
      type: UPDATE_APP_STATE,
      appState: nextAppState,
    });
  });
};

// action handlers
const actionHandler = {
  [LOCK_WALLET]: state => ({...state,
    walletUnlocked: false,
    failedLoginAttempts: state.failedLoginAttempts === undefined ? 1 : state.failedLoginAttempts + 1,
  }),
  [TIME_LOCK_WALLET]: state => ({...state,
    timeLock: true,
    permaLock: false,
    walletUnlocked: false,
    failedLoginAttempts: 0,
    timeLockAt: Math.floor(Date.now() / 1000),
  }),
  [DAY_LOCK_WALLET]: state => ({...state,
    dayLock: true,
    permaLock: false,
    walletUnlocked: false,
    failedLoginAttempts: 0,
    dayLockAt: Math.floor(Date.now() / 1000),
  }),
  [PERMA_LOCK_WALLET]: state => ({...state,
    permaLock: true,
    walletUnlocked: false,
    failedLoginAttempts: MAX_LOGIN_ATTEMPTS,
  }),
  [UNLOCK_WALLET]: state => ({...state,
    walletUnlocked: true,
    failedLoginAttempts: 0,
    timeLock: false,
    timeLockAt: 0,
    permaLock: false,
  }),
  [CLEAR_UNLOCK]: state => ({
    ...state,
    walletUnlocked: null,
    timeLastUnlocked: Date.now(),
  }),
  [ADD_PASSCODE]: (state, {passcode}) => ({
    ...state,
    passcode,
    passcodeSet: true,
  }),
  [RESET_PASSCODE]: state => ({
    ...state,
    passcode: '',
    passcodeSet: false,
  }),
  [SET_BIOMETRIC_AVAILABILITY]: (state, {available, faceIDSupported}) => ({
    ...state,
    biometricsAvailable: available,
    biometricsEnabled:
      state.biometricsEnabled === true && !available
        ? false
        : state.biometricsEnabled,
    faceIDSupported,
  }),
  [SET_BIOMETRIC_ENABLED]: (state, {boolean}) => ({
    ...state,
    biometricsEnabled: boolean,
  }),
  [UPDATE_APP_STATE]: (state, {appState}) => ({
    ...state,
    appState,
  }),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
