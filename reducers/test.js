// initial state
const initialState = {
  n: 0
};

// constants
export const BUTTON_CLICKED = 'BUTTON_CLICKED';

// action
export const click = () => dispatch => {
  dispatch({
    type: BUTTON_CLICKED
  });
};

// action handlers
const actionHandler = {
  [BUTTON_CLICKED]: state => ({ ...state, n: state.n + 1 })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
