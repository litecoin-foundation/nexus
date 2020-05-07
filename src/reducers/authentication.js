import {getItem} from '../lib/utils/keychain';
import {authenticate} from '../lib/utils/biometric';
import {unlockWallet} from './lightning';

// initial state
const initialState = {
  passcode: '',
  passcodeSet: false,
  walletUnlocked: null,
  biometricsAvailable: null,
  biometricsEnabled: false,
  faceIDSupported: false,
};

// constants
export const ADD_PASSCODE = 'ADD_PASSCODE';
export const UNLOCK_WALLET = 'UNLOCK_WALLET';
export const CLEAR_UNLOCK = 'CLEAR_UNLOCK';
export const SET_BIOMETRIC_AVAILABILITY = 'SET_BIOMETRIC_AVAILABILITY';
export const SET_BIOMETRIC_ENABLED = 'SET_BIOMETRIC_ENABLED';

// actions
export const addPincode = passcode => dispatch => {
  dispatch({
    type: ADD_PASSCODE,
    passcode,
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
    await dispatch(unlockWallet());
    dispatch({
      type: UNLOCK_WALLET,
      payload: true,
    });
  }
};

export const unlockWalletWithBiometric = () => async dispatch => {
  try {
    await authenticate('Unlock Wallet');
    await dispatch(unlockWallet());
    dispatch({
      type: UNLOCK_WALLET,
      payload: true,
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

export const setBiometricAvailability = (
  available,
  faceIDSupported,
) => dispatch => {
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

// action handlers
const actionHandler = {
  [UNLOCK_WALLET]: (state, {payload}) => ({...state, walletUnlocked: payload}),
  [CLEAR_UNLOCK]: state => ({...state, walletUnlocked: null}),
  [ADD_PASSCODE]: (state, {passcode}) => ({
    ...state,
    passcode,
    passcodeSet: true,
  }),
  [SET_BIOMETRIC_AVAILABILITY]: (state, {available, faceIDSupported}) => ({
    ...state,
    biometricsAvailable: available,
    faceIDSupported,
  }),
  [SET_BIOMETRIC_ENABLED]: (state, {boolean}) => ({
    ...state,
    biometricsEnabled: boolean,
  }),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
