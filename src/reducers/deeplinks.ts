import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppThunk} from './types';
import {decodeBIP21} from '../utils/bip21';
import qs from 'qs';

// types
interface IDeeplinkState {
  deeplinkSet: boolean;
  uri: string;
}

interface IDeeplinkDecoded {
  stack: string;
  screen: string;
  options: {
    [key: string]: any;
  } | null;
}

// initial state
const initialState = {
  deeplinkSet: false,
  uri: '',
} as IDeeplinkState;

// actions
const setDeeplinkAction = createAction<string>('deeplinks/setDeeplinkAction');
export const unsetDeeplink = createAction('deeplinks/unsetDeeplink');

// functions
export function decodeAppDeeplink(deeplink: string): IDeeplinkDecoded {
  let stack = '';
  let screen = '';
  let options = null;
  if (deeplink.startsWith('nexus://')) {
    const querySplit = deeplink.indexOf('?');
    const query = querySplit === -1 ? '' : deeplink.slice(querySplit + 1);
    options = qs.parse(query);

    const nestedUri = deeplink.slice('nexus://'.length, querySplit);
    if (nestedUri) {
      switch (nestedUri) {
        case 'importprivkey':
          stack = 'SettingsStack';
          screen = 'ImportDeeplink';
          break;
        case 'verifyotp':
          stack = 'NexusShopStack';
          screen = 'VerifyOTP';
          break;
        default:
          // stack = 'OnboardingStack';
          // screen = 'Initial';
          stack = 'NewWalletStack';
          screen = 'Main';
          break;
      }
    }
  }
  return {
    stack,
    screen,
    options,
  };
}

export const setDeeplink =
  (link: string): AppThunk =>
  dispatch => {
    try {
      // decodeAppDeeplink(link);
      dispatch(setDeeplinkAction(link));
    } catch (error) {
      console.error(error);
    }
  };

// slice
export const deeplinksSlice = createSlice({
  name: 'deeplinks',
  initialState,
  reducers: {
    setDeeplinkAction: (state, action: PayloadAction<string>) => ({
      ...state,
      deeplinkSet: true,
      uri: action.payload,
    }),
    unsetDeeplink: state => ({...state, deeplinkSet: false, uri: ''}),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export default deeplinksSlice.reducer;
