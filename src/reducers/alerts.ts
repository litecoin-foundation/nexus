import {showError} from './errors';
import {AppThunk} from './types';

// types
type IAlert = {
  _id: string;
  deviceToken: string;
  value: number;
  index: number;
  isPositive: boolean;
  isIOS: boolean;
  isFired: boolean;
  enabled: boolean;
  createdAt: string;
};

type PostedAlert = {
  value: number;
  originalValue: number;
  isIOS: boolean;
};

interface IAlerts {
  alerts: IAlert[];
}

// initial state
const initialState = {
  alerts: [],
} as IAlerts;

// constants
const ADD_ALERT = 'ADD_ALERT';
const REMOVE_ALERT = 'REMOVE_ALERT';
const SET_ALERT_AVAILABILITY = 'SET_ALERT_AVAILABILITY';

const alertProviderUrl = 'https://mobile.litecoin.com/alert';

// actions
export const syncAlerts = (): AppThunk => async (dispatch, getState) => {
  const deviceToken = getState().settings.deviceNotificationToken;

  try {
    const req = await fetch(`${alertProviderUrl}/get-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken: deviceToken,
      }),
    });

    if (!req.ok) {
      return;
    }

    const res = await req.json();

    if (res && res.length > 0) {
      const alerts: IAlert[] = JSON.parse(JSON.stringify(res));

      const adjustedForTheAppAlerts = alerts.map(
        (alert: IAlert) => (alert.enabled = !alert.isFired),
      );

      dispatch({
        type: ADD_ALERT,
        alerts: adjustedForTheAppAlerts,
      });
    }
  } catch (error) {
    console.error(error);
  }
};
export const addAlert =
  (data: PostedAlert): AppThunk =>
  async (dispatch, getState) => {
    const {rates}: any = getState().ticker;
    if (!rates) {
      return;
    }

    try {
      const req = await fetch(`${alertProviderUrl}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: getState().settings.deviceNotificationToken,
          value: Number(data.originalValue),
          isPositive: data.originalValue > rates.USD,
          isIOS: data.isIOS,
        }),
      });

      if (!req.ok) {
        const res = await req.text();
        dispatch(showError(res));
        return;
      }

      const res = await req.json();

      if (res.hasOwnProperty('deviceToken')) {
        const newAlert: IAlert = JSON.parse(JSON.stringify(res));
        newAlert.enabled = !newAlert.isFired;

        const {alerts} = getState().alerts;

        const alertsBuf: IAlert[] = alerts
          ? JSON.parse(JSON.stringify(alerts))
          : [];

        alertsBuf.push(newAlert);
        dispatch({
          type: ADD_ALERT,
          alerts: alertsBuf,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

export const removeAlert =
  (index: number): AppThunk =>
  async (dispatch, getState) => {
    try {
      const req = await fetch(`${alertProviderUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: getState().settings.deviceNotificationToken,
          index: Number(index),
        }),
      });

      if (!req.ok) {
        const res = await req.text();
        dispatch(showError(res));
        return;
      }

      const res = await req.json();

      if (res.hasOwnProperty('deviceToken')) {
        const alert = JSON.parse(JSON.stringify(res));

        dispatch({
          type: REMOVE_ALERT,
          id: alert._id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

export const setAlertAvailability =
  (index: number, availability: boolean): AppThunk =>
  async (dispatch, getState) => {
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
        },
      );

      if (!req.ok) {
        const res = await req.text();
        dispatch(showError(res));
        return;
      }

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
      console.error(error);
    }
  };

// action handlers
const actionHandler = {
  [ADD_ALERT]: (state: any, {alerts}: any) => ({...state, alerts}),
  [REMOVE_ALERT]: (state: any, {id}: any) => ({
    ...state,
    alerts: state.alerts.filter((obj: IAlert) => obj._id !== id),
  }),
  [SET_ALERT_AVAILABILITY]: (state: any, {id, availability}: any) => ({
    ...state,
    alerts: state.alerts.map((alert: IAlert) => {
      if (alert._id === id) {
        const alertBuf = {
          ...alert,
          isFired: !availability,
          enabled: availability,
        };
        return alertBuf;
      } else {
        return alert;
      }
    }),
  }),
};

enum ActionTypes {
  A = ADD_ALERT,
  B = REMOVE_ALERT,
  C = SET_ALERT_AVAILABILITY,
}

interface IActionA {
  type: ActionTypes.A;
  payload: any;
}

interface IActionB {
  type: ActionTypes.B;
  payload: any;
}

interface IActionC {
  type: ActionTypes.C;
  payload: any;
}

type IAction = IActionA | IActionB | IActionC;

// reducer
export default function (state = initialState, action: IAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
