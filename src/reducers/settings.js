// initial state
const initialState = {
  lastViewSeed: null,
};

// constants
const UPDATE_LAST_VIEW_SEED = 'UPDATE_LAST_VIEW_SEED';

// actions
export const updateLastViewSeed = () => (dispatch) => {
  dispatch({
    type: UPDATE_LAST_VIEW_SEED,
    time: new Date(),
  });
};

// action handlers
const actionHandler = {
  [UPDATE_LAST_VIEW_SEED]: (state, {time}) => ({
    lastViewSeed: time,
  }),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
