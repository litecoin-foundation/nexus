import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// initial state
const initialState = {
  address: '',
};

// constants
export const GET_ADDRESS = 'GET_ADDRESS';

// actions
export const getAddress = () => async (dispatch) => {
  const {address} = await LndInstance.sendCommand('NewAddress', {type: 3});
  dispatch({
    type: GET_ADDRESS,
    address,
  });
};

// action handlers
const actionHandler = {
  [GET_ADDRESS]: (state, {address}) => ({...state, address}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
