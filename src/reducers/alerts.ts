import {AppThunk} from './types';

// initial state
const initialState = {
  alerts: [],
};

// constants
const ADD_ALERT = 'ADD_ALERT';
const REMOVE_ALERT = 'REMOVE_ALERT';
const SET_ALERT_AVAILABILITY = 'SET_ALERT_AVAILABILITY';

const alertProviderUrl = 'http://localhost:3000/alert';

// actions
export const addAlert = (data): AppThunk => async (dispatch, getState) => {
  try {
    const req = await fetch(
      `${alertProviderUrl}/add`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: getState().settings.deviceNotificationToken,
          value: Number(data.value),
          isPositive: data.value > data.originalValue,
          isIOS: data.isIOS,
        }),
      }
    );

    const res = await req.json();

    if (res.hasOwnProperty('deviceToken')) {
      const newAlert = JSON.parse(JSON.stringify(res));

      const {alerts} = getState().alerts;

      const alertsBuf = alerts ? JSON.parse(JSON.stringify(alerts)) : [];

      alertsBuf.push(newAlert);
      dispatch({
        type: ADD_ALERT,
        alerts: alertsBuf,
      });
    }
  } catch (error) {
    // console.error(error);
  }
};

export const removeAlert = (index): AppThunk  => async (dispatch, getState) => {
  try {
    const req = await fetch(
      `${alertProviderUrl}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: getState().settings.deviceNotificationToken,
          index: Number(index),
        }),
      }
    );

    const res = await req.json();

    if (res.hasOwnProperty('deviceToken')) {
      const alert = JSON.parse(JSON.stringify(res));

      dispatch({
        type: REMOVE_ALERT,
        id: alert._id,
      });
    }
  } catch (error) {
    // console.error(error);
  }
};

export const setAlertAvailability = (index, availability): AppThunk  => async (dispatch, getState) => {
  try {
    const req = await fetch(
      `${alertProviderUrl}/${availability ? 'reset' : 'set-fired'}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: getState().settings.deviceNotificationToken,
          index: Number(index),
        }),
      }
    );

    const res = await req.json();

    if (res.hasOwnProperty('deviceToken')) {
      const alert = JSON.parse(JSON.stringify(res));

      dispatch({
        type: SET_ALERT_AVAILABILITY,
        id: alert._id,
        availability: !alert.isFired,
      });
    }
  } catch (error) {
    // console.error(error);
  }
};

// action handlers
const actionHandler = {
  [ADD_ALERT]: (state, {alerts}) => ({...state, alerts}),
  [REMOVE_ALERT]: (state, {id}) => ({
    ...state,
    alerts: state.alerts.filter((obj) => obj._id !== id),
  }),
  [SET_ALERT_AVAILABILITY]: (state, {id, availability}) => ({
    ...state,
    alerts: () => {
      const updatedAlerts = JSON.parse(JSON.stringify(state.alerts));
      updatedAlerts.map((alert, i) => {
        if (alert._id === id) {
          const alertBuf = {...alert, isFired: !availability, enabled: availability};
          alert = alertBuf;
          return alert;
        } else {
          return alert;
        }
      });
      return updatedAlerts;
    },
  }),
};

// reducer
export default function (state = initialState, action) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
