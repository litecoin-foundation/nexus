// initial state
const initialState = {
  amount: '0.00',
  fiatAmount: '0.00',
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
};

export const updateFiatAmount = fiatAmount => dispatch => {
  dispatch({
    type: UPDATE_FIAT_AMOUNT,
    fiatAmount,
  });
};

export const resetInputs = () => dispatch => {
  dispatch({type: RESET_INPUTS});
};

// action handlers
const actionHandler = {
  [UPDATE_AMOUNT]: (state, {amount}) => ({...state, amount}),
  [UPDATE_FIAT_AMOUNT]: (state, {fiatAmount}) => ({...state, fiatAmount}),
  [RESET_INPUTS]: state => ({...state, amount: '0.00', fiatAmount: '0.00'}),
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
