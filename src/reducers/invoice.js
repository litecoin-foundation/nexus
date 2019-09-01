import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

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
    const request = {
      memo: invoice.memo,
      value: invoice.amount,
    };
    const {paymentRequest} = await LndInstance.sendCommand(
      'AddInvoice',
      request,
    );
    dispatch({
      type: ADD_INVOICE,
      paymentRequest,
      description: invoice.memo,
      value: invoice.value,
    });
    return true;
  } catch (error) {
    console.log(error);
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
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
