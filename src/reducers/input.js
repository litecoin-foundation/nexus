// initial state
const initialState = {
  amount: '',
  fiatAmount: '',
  toAddress: '',
  message: '',
  fee: 1,
};

// constants
export const UPDATE_AMOUNT = 'UPDATE_AMOUNT';
export const UPDATE_FIAT_AMOUNT = 'UPDATE_FIAT_AMOUNT';
export const UPDATE_TO_ADDRESS = 'UPDATE_TO_ADDRESS';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const UPDATE_FEE = 'UPDATE_FEE';
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

export const updateToAddress = toAddress => dispatch => {
  dispatch({
    type: UPDATE_TO_ADDRESS,
    toAddress,
  });
};

export const updateMessage = message => dispatch => {
  dispatch({
    type: UPDATE_MESSAGE,
    message,
  });
};

export const updateFee = fee => dispatch => {
  dispatch({
    type: UPDATE_FEE,
    fee,
  });
};

export const resetInputs = () => dispatch => {
  dispatch({type: RESET_INPUTS});
};

const handleFiatConversion = () => (dispatch, getState) => {
  const {amount} = getState().input;
  const {paymentRate} = getState().ticker;

  dispatch({
    type: UPDATE_FIAT_AMOUNT,
    fiatAmount: paymentRate ?
      `${(parseFloat(amount) * paymentRate).toFixed(2)}`
      :
      0,
  });
};

const handleAmountConversion = () => (dispatch, getState) => {
  const {fiatAmount} = getState().input;
  const {paymentRate} = getState().ticker;
  dispatch({
    type: UPDATE_AMOUNT,
    amount: paymentRate ?
      `${(parseFloat(fiatAmount) / paymentRate).toFixed(4)}`
      :
      0,
  });
};

// action handlers
const actionHandler = {
  [UPDATE_AMOUNT]: (state, {amount}) => ({...state, amount}),
  [UPDATE_FIAT_AMOUNT]: (state, {fiatAmount}) => ({...state, fiatAmount}),
  [UPDATE_TO_ADDRESS]: (state, {toAddress}) => ({...state, toAddress}),
  [UPDATE_MESSAGE]: (state, {message}) => ({...state, message}),
  [UPDATE_FEE]: (state, {fee}) => ({...state, fee}),
  [RESET_INPUTS]: state => ({...state, amount: '', fiatAmount: '', toAddress: '', message: '', fee: 1}),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
