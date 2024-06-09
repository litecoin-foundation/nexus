// initial state
const initialState = {
  amount: '',
  fiatAmount: '',
};

// constants
export const UPDATE_AMOUNT = 'UPDATE_AMOUNT';
export const UPDATE_FIAT_AMOUNT = 'UPDATE_FIAT_AMOUNT';
export const RESET_INPUTS = 'RESET_INPUTS';

// actions
export const updateAmount = amount => dispatch => {
  dispatch({
    type: UPDATE_AMOUNT,
    amount,
  });
  dispatch(handleFiatConversion());
};

export const updateFiatAmount = fiatAmount => dispatch => {
  dispatch({
    type: UPDATE_FIAT_AMOUNT,
    fiatAmount,
  });
  dispatch(handleAmountConversion());
};

export const resetInputs = () => dispatch => {
  dispatch({type: RESET_INPUTS});
};

const handleFiatConversion = () => (dispatch, getState) => {
  const {amount} = getState().input;
  const {paymentRate} = getState().ticker;

  dispatch({
    type: UPDATE_FIAT_AMOUNT,
    fiatAmount: `${(parseFloat(amount) * paymentRate).toFixed(2)}`,
  });
};

const handleAmountConversion = () => (dispatch, getState) => {
  const {fiatAmount} = getState().input;
  const {paymentRate} = getState().ticker;
  dispatch({
    type: UPDATE_AMOUNT,
    amount: `${(parseFloat(fiatAmount) / paymentRate).toFixed(4)}`,
  });
};

// action handlers
const actionHandler = {
  [UPDATE_AMOUNT]: (state, {amount}) => ({...state, amount}),
  [UPDATE_FIAT_AMOUNT]: (state, {fiatAmount}) => ({...state, fiatAmount}),
  [RESET_INPUTS]: state => ({...state, amount: '', fiatAmount: ''}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
