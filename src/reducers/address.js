import lnd from '@litecoinfoundation/react-native-lndltc';

// initial state
const initialState = {
  address: '',
};

// constants
export const GET_ADDRESS = 'GET_ADDRESS';

// actions
export const getAddress = () => async dispatch => {
  const rpc = await lnd.getAddress();

  if (rpc.isErr()) {
    console.error(`getAddress error: ${rpc.error}`);
  }

  if (rpc.isOk()) {
    const {address} = rpc.value;
    dispatch({
      type: GET_ADDRESS,
      address,
    });
  }
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
