import {createAction, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './types';
import {decodeBIP21} from '../lib/utils/bip21';

// types
interface IDeeplinkState {
  deeplinkSet: boolean;
  uri: string;
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
export const setDeeplink =
  (link: string): AppThunk =>
  dispatch => {
    try {
      decodeBIP21(link);
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
});

export default deeplinksSlice.reducer;
