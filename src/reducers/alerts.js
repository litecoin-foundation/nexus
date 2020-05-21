// initial state
const initialState = {
  alerts: [],
};

// constants
const ADD_ALERT = 'ADD_ALERT';
const REMOVE_ALERT = 'REMOVE_ALERT';
const SET_ALERT_AVAILABILITY = 'SET_ALERT_AVAILABILITY';

// actions
export const addAlert = (data) => (dispatch, getState) => {
  const {alerts} = getState().alerts;
  alerts.push(data);
  dispatch({
    type: ADD_ALERT,
    alerts,
  });
};

export const removeAlert = (id) => (dispatch) => {
  dispatch({
    type: REMOVE_ALERT,
    id,
  });
};

export const setAlertAvailability = (id, availability) => (dispatch) => {
  dispatch({
    type: SET_ALERT_AVAILABILITY,
    id,
    availability,
  });
};

// action handlers
const actionHandler = {
  [ADD_ALERT]: (state, {alerts}) => ({...state, alerts}),
  [REMOVE_ALERT]: (state, {id}) => ({
    ...state,
    alerts: state.alerts.filter((obj) => obj.id !== id),
  }),
  [SET_ALERT_AVAILABILITY]: (state, {id, availability}) => ({
    ...state,
    alerts: state.alerts.map((alert) => {
      if (alert.id === id) {
        alert.enabled = availability;
        return alert;
      } else {
        return alert;
      }
    }),
  }),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
