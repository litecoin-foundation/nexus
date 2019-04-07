import Lightning from '../lib/lightning/lightning';

const LndInstance = new Lightning();

// inital state
const initialState = {
  lndActive: false
};

// constants
export const START_LND = 'START_LND';
export const STOP_LND = 'STOP_LND';

// actions
export const startLnd = () => async dispatch => {
  try {
    await LndInstance.init();
    dispatch({
      type: START_LND
    });
  } catch (err) {
    console.log('CANT start LND');
    // TODO: handle this
  }
};

export const stopLnd = () => async dispatch => {
  try {
    await LndInstance.close();
    dispatch({
      type: STOP_LND
    });
  } catch (err) {
    console.log('CANT stop LND');
    // TODO: handle this
  }
};

// action handlers
const actionHandler = {
  [START_LND]: state => ({ ...state, lndActive: true }),
  [STOP_LND]: state => ({ ...state, lndActive: false })
};

// reducer
export default function(state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
