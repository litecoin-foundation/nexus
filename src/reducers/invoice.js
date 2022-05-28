import lnd from '@litecoinfoundation/react-native-lndltc';

// initial state
const initialState = {
  paymentRequest: '',
  description: '',
  value: 0,
};

// constants
export const ADD_INVOICE = 'ADD_INVOICE';
export const CLEAR_INVOICE = 'CLEAR_INVOICE';

// actions
export const addInvoice = invoice => async dispatch => {
  try {
    // const request = {
    //   value: invoice.amount,
    //   memo: invoice.memo,
    // };
    // const rpc = await lnd.createInvoice(50000, 'test');
    // console.error(`POOPY: ${rpc.value}`);
    // if (rpc.isErr()) {
    //   console.error(rpc.error);
    //   return;
    // }
    // if (rpc.isOk()) {
    //   console.error(`POOPY: ${rpc.value}`);
    //   console.log(rpc.value);
    //   const {paymentRequest} = rpc.value;
    //   dispatch({
    //     type: ADD_INVOICE,
    //     paymentRequest,
    //     description: invoice.memo,
    //     value: invoice.amount,
    //   });
    //   return true;
    // }
  } catch (error) {
    alert(error);
  }
};

export const clearInvoice = () => dispatch => {
  dispatch({
    type: CLEAR_INVOICE,
    paymentRequest: '',
    description: '',
    value: '',
  });
};

// action handlers
const actionHandler = {
  [ADD_INVOICE]: (state, {paymentRequest, description, value}) => ({
    ...state,
    paymentRequest,
    description,
    value,
  }),
  [CLEAR_INVOICE]: (state, {paymentRequest, description, value}) => ({
    ...state,
    paymentRequest,
    description,
    value,
  }),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
