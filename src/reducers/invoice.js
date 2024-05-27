import * as Lnd from '../lib/lightning';

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
    const {amount, memo} = invoice;
    const {paymentRequest} = await Lnd.addInvoice(amount, memo);

    dispatch({
      type: ADD_INVOICE,
      paymentRequest,
      description: invoice.memo,
      value: invoice.amount,
    });
    return true;
  } catch (error) {
    console.error(error);
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
