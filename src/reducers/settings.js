// initial state
const initialState = {};

// constants

// actions

// action handlers
const actionHandler = {};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
