import {AnyAction} from '@reduxjs/toolkit';
import {ReduxType, AppThunk, IActionHandler} from './types';
import {decodeBIP21} from '../lib/utils/bip21';

// initial state
const initialState = {
  deeplinkSet: false,
  uri: '',
};

// constants
export const SET_DEEPLINK: ReduxType = 'SET_DEEPLINK';
export const UNSET_DEEPLINK: ReduxType = 'UNSET_DEEPLINK';

// actions
export const setDeeplink =
  (link: string): AppThunk =>
  dispatch => {
    try {
      decodeBIP21(link);
      dispatch({
        type: 'SET_DEEPLINK',
        uri: link,
      });
    } catch (error) {
      console.error(error);
    }
  };

export const unsetDeeplink = (): AppThunk => dispatch => {
  dispatch({type: UNSET_DEEPLINK});
};

// action handler
const actionHandler: IActionHandler = {
  [SET_DEEPLINK]: (state, {uri}) => ({...state, deeplinkSet: true, uri}),
  [UNSET_DEEPLINK]: state => ({...state, deeplinkSet: false, uri: ''}),
};

// reducer
export default function (state = initialState, action: AnyAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
