import lnd, {ss_lnrpc} from '@litecoinfoundation/react-native-lndltc';
import {AppState} from 'react-native';

import {getItem} from '../lib/utils/keychain';
import {authenticate} from '../lib/utils/biometric';
import {unlockWallet} from './lightning';
import {setItem, resetItem} from '../lib/utils/keychain';

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
};

// constants
export const ADD_PASSCODE = 'ADD_PASSCODE';
export const RESET_PASSCODE = 'RESET_PASSCODE';
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

export const unlockWalletWithPin = pincodeAttempt => async dispatch => {
  const pincode = await getItem('PINCODE');
  if (pincodeAttempt !== pincode) {
    dispatch({
      type: UNLOCK_WALLET,
      payload: false,
    });
  } else {
    dispatch(await unlockWallet());
    lnd.stateService.subscribeToStateChanges(res => {
      if (res.isOk()) {
        if (res.value === ss_lnrpc.WalletState.UNLOCKED) {
          dispatch({
            type: UNLOCK_WALLET,
            payload: true,
          });
        }
      }
    });
  }
};

export const unlockWalletWithBiometric = () => async dispatch => {
  try {
    await authenticate('Unlock Wallet');
    dispatch(await unlockWallet());
    lnd.stateService.subscribeToStateChanges(res => {
      if (res.isOk()) {
        if (res.value === ss_lnrpc.WalletState.UNLOCKED) {
          dispatch({
            type: UNLOCK_WALLET,
            payload: true,
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
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
      lnd.stateService.subscribeToStateChanges(res => {
        if (res.isOk()) {
          if (res.value === ss_lnrpc.WalletState.LOCKED) {
            //
            console.warn('bg: user wallet locked!');
          }
        }
      });
    }

    dispatch({
      type: UPDATE_APP_STATE,
      appState: nextAppState,
    });
  });
};

// action handlers
const actionHandler = {
  [UNLOCK_WALLET]: (state, {payload}) => ({...state, walletUnlocked: payload}),
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
