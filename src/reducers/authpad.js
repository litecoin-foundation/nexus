// initial state
const initialState = {
  pin: ''
};

// constants
const INPUT_VALUE = 'INPUT_VALUE';
const BACKSPACE_VALUE = 'BACKSPACE_VALUE';
const CLEAR_VALUES = 'CLEAR_VALUES';

// actions
export const inputValue = input => dispatch => {
  dispatch({
    type: INPUT_VALUE,
    input
  });
};

export const backspaceValue = () => dispatch => {
  dispatch({ type: BACKSPACE_VALUE });
};

export const clearValues = () => dispatch => {
  dispatch({ type: CLEAR_VALUES });
};

// action handlers
const actionHandler = {
  [INPUT_VALUE]: (state, { input }) => ({ ...state, pin: state.pin + input }),
  [BACKSPACE_VALUE]: state => ({ ...state, pin: state.pin.slice(0, -1) }),
  [CLEAR_VALUES]: state => ({ ...state, pin: '' })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
