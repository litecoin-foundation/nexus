import Lightning from '../lib/lightning/lightning';
import { sleep } from '../lib/utils';

const LndInstance = new Lightning();

// initial state
const initialState = {
  identityPubkey: '',
  alias: '',
  version: '',
  syncedToChain: false,
  blockHeight: 0,
  blockHash: '',
  bestHeaderTimestamp: 0,
  uris: [],
  chains: []
};

// constants
export const GET_INFO = 'GET_INFO';

// actions
export const getInfo = (retries = Infinity) => async dispatch => {
  while ((retries -= 1)) {
    const info = await LndInstance.sendCommand('getInfo');

    dispatch({
      type: GET_INFO,
      info
    });
    await sleep();
  }
};

// action handlers
const actionHandler = {
  [GET_INFO]: (state, { info }) => ({
    ...state,
    ...info
  })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
