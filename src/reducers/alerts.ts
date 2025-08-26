// In order to keep the same instances of alert collection on both client's wallet and
// api server, we have to sync them interchangably. First we fetch fired alerts
// from the api server and disable them in the client's app by comparing their indexes.
// Then we call the server passing the latest state of the alert collection, to keep the server up
// with user's manual changes such as on/off toggle and price target.
// updateFiredAlertsFromApiServer() is called on startup and triggers resyncAlertsOnApiServer.
// Every CRUD operation triggers resyncAlertsOnApiServer.

import {showError} from './errors';
import {AppThunk} from './types';
import {fetchResolve} from '../utils/tor';

// types
type IAlert = {
  _id: string;
  deviceToken: string;
  value: number;
  valueInLocal: number;
  index: number;
  isPositive: boolean;
  isIOS: boolean;
  isFired: boolean;
  createdAt: string;
  lastTimePriceCache: number;
  lastTimePriceCachedAt: number;
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
const UPDATE_LAST_TIME_PRICE = 'UPDATE_LAST_TIME_PRICE';

const alertProviderUrl = 'https://api.nexuswallet.com/alert';

const MAX_ALERTS = 5;

export const resyncAlertsOnApiServer =
  (): AppThunk => async (dispatch, getState) => {
    const deviceToken = getState().settings.deviceNotificationToken;
    const torEnabled = getState().settings.torEnabled;
    const alerts = getState().alerts.alerts;

    if (!deviceToken) {
      return;
    }

    const alertsWithoutId = alerts
      ? alerts.map((alert: IAlert) => {
          return {
            deviceToken: alert.deviceToken,
            value: alert.value,
            index: alert.index,
            isPositive: alert.isPositive,
            isIOS: alert.isIOS,
            isFired: alert.isFired,
            createdAt: alert.createdAt,
          };
        })
      : [];

    try {
      fetchResolve(
        `${alertProviderUrl}/resync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceToken: deviceToken,
            alerts: alertsWithoutId,
          }),
        },
        torEnabled,
      );
    } catch (error) {
      console.error(error);
    }
  };

export const updateFiredAlertsFromApiServer =
  (): AppThunk => async (dispatch, getState) => {
    const deviceToken = getState().settings.deviceNotificationToken;
    const torEnabled = getState().settings.torEnabled;
    const alerts = getState().alerts.alerts;

    if (!deviceToken) {
      return;
    }

    const alertsWithoutId = alerts
      ? alerts.map((alert: IAlert) => {
          return {
            deviceToken: alert.deviceToken,
            value: alert.value,
            index: alert.index,
            isPositive: alert.isPositive,
            isIOS: alert.isIOS,
            isFired: alert.isFired,
            createdAt: alert.createdAt,
          };
        })
      : [];

    try {
      const data = await fetchResolve(
        `${alertProviderUrl}/get-fired`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceToken: deviceToken,
            alerts: alertsWithoutId,
          }),
        },
        torEnabled,
      );

      data.map((serverFiredAlert: any) => {
        dispatch({
          type: SET_ALERT_AVAILABILITY,
          index: serverFiredAlert.index,
          availability: !serverFiredAlert.isFired,
        });
      });

      dispatch(resyncAlertsOnApiServer());
    } catch (error) {
      console.error(error);
    }
  };

export const addAlert =
  (data: PostedAlert): AppThunk =>
  async (dispatch, getState) => {
    const {currencyCode}: any = getState().settings;
    const {rates}: any = getState().ticker;

    const localToUSD = rates.USD / rates[currencyCode];
    const valueInLocal = parseFloat(
      String(data.originalValue / localToUSD),
    ).toFixed(1);

    if (!rates) {
      dispatch(showError('Price rates are missing.'));
      return;
    }

    try {
      const {alerts} = getState().alerts;

      if (!alerts || (alerts && alerts.length < MAX_ALERTS)) {
        const newAlert: IAlert = {
          _id: 'unknown',
          deviceToken: getState().settings.deviceNotificationToken,
          value: Number(data.originalValue),
          valueInLocal: Number(valueInLocal),
          index: alerts ? alerts.length : 0,
          isPositive: data.originalValue > rates.USD,
          isIOS: data.isIOS,
          isFired: false,
          createdAt: new Date().toISOString(),
          lastTimePriceCache: 0,
          lastTimePriceCachedAt: 0,
        };

        const alertsBuf: IAlert[] = alerts
          ? JSON.parse(JSON.stringify(alerts))
          : [];
        alertsBuf.push(newAlert);

        dispatch({
          type: ADD_ALERT,
          alerts: alertsBuf,
        });
      } else if (alerts.length === MAX_ALERTS) {
        const alertsBuf: IAlert[] = [];

        for (let i = 0; i < alerts.length - 1; i++) {
          const shiftForwardAlert: IAlert = {
            _id: alerts[i]._id,
            deviceToken: getState().settings.deviceNotificationToken,
            value: alerts[i + 1].value,
            valueInLocal: alerts[i + 1].valueInLocal,
            index: alerts[i].index,
            isPositive: alerts[i + 1].isPositive,
            isIOS: alerts[i + 1].isIOS,
            isFired: alerts[i + 1].isFired,
            createdAt: alerts[i + 1].createdAt,
            lastTimePriceCache: alerts[i + 1].lastTimePriceCache,
            lastTimePriceCachedAt: alerts[i + 1].lastTimePriceCachedAt,
          };
          alertsBuf.push(shiftForwardAlert);
        }

        const newAlert: IAlert = {
          _id: 'unknown',
          deviceToken: getState().settings.deviceNotificationToken,
          value: Number(data.originalValue),
          valueInLocal: Number(valueInLocal),
          index: alerts.length - 1,
          isPositive: data.originalValue > rates.USD,
          isIOS: data.isIOS,
          isFired: false,
          createdAt: new Date().toISOString(),
          lastTimePriceCache: 0,
          lastTimePriceCachedAt: 0,
        };
        alertsBuf.push(newAlert);

        dispatch({
          type: ADD_ALERT,
          alerts: alertsBuf,
        });
      }

      // Add alert on api server
      // fetch(`${alertProviderUrl}/add`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     deviceToken: getState().settings.deviceNotificationToken,
      //     value: Number(data.originalValue),
      //     isPositive: data.originalValue > rates.USD,
      //     isIOS: data.isIOS,
      //   }),
      // });
      // Or just resync all alerts on api server
      dispatch(resyncAlertsOnApiServer());
    } catch (error) {
      console.error(error);
    }
  };

export const removeAlert =
  (index: number): AppThunk =>
  async (dispatch, getState) => {
    try {
      dispatch({
        type: REMOVE_ALERT,
        index,
      });

      const {alerts} = getState().alerts;
      const alertsBuf: IAlert[] = [];

      alerts
        .filter((obj: IAlert) => obj.index !== index)
        .map((alert: IAlert, i: number) => {
          const reindexAlert: IAlert = {
            _id: alert._id,
            deviceToken: alert.deviceToken,
            value: alert.value,
            valueInLocal: alert.valueInLocal,
            index: i,
            isPositive: alert.isPositive,
            isIOS: alert.isIOS,
            isFired: alert.isFired,
            createdAt: alert.createdAt,
            lastTimePriceCache: alert.lastTimePriceCache,
            lastTimePriceCachedAt: alert.lastTimePriceCachedAt,
          };
          alertsBuf.push(reindexAlert);
        });

      dispatch({
        type: ADD_ALERT,
        alerts: alertsBuf,
      });

      // Delete alert on api server
      // fetch(`${alertProviderUrl}/delete`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     deviceToken: getState().settings.deviceNotificationToken,
      //     index: Number(index),
      //   }),
      // });
      // Or just resync all alerts on api server
      dispatch(resyncAlertsOnApiServer());
    } catch (error) {
      console.error(error);
    }
  };

export const setAlertAvailability =
  (index: number, availability: boolean): AppThunk =>
  async dispatch => {
    try {
      dispatch({
        type: SET_ALERT_AVAILABILITY,
        index: index,
        availability: availability,
      });

      // Update alert on api server
      // fetch(`${alertProviderUrl}/${availability ? 'reset' : 'set-fired'}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     deviceToken: getState().settings.deviceNotificationToken,
      //     index: Number(index),
      //   }),
      // });
      // Or just resync all alerts on api server
      dispatch(resyncAlertsOnApiServer());
    } catch (error) {
      console.error(error);
    }
  };

export const updateLastTimePrice =
  (index: number, lastTimePrice: number): AppThunk =>
  dispatch => {
    dispatch({
      type: UPDATE_LAST_TIME_PRICE,
      index: index,
      lastTimePrice: lastTimePrice,
    });
  };

// action handlers
const actionHandler = {
  [ADD_ALERT]: (state: any, {alerts}: any) => ({...state, alerts}),
  [REMOVE_ALERT]: (state: any, {index}: any) => ({
    ...state,
    alerts: state.alerts.filter((obj: IAlert) => obj.index !== index),
  }),
  [SET_ALERT_AVAILABILITY]: (state: any, {index, availability}: any) => ({
    ...state,
    alerts: state.alerts.map((alert: IAlert) => {
      if (alert.index === index) {
        const alertBuf = {
          ...alert,
          isFired: !availability,
        };
        return alertBuf;
      } else {
        return alert;
      }
    }),
  }),
  [UPDATE_LAST_TIME_PRICE]: (state: any, {index, lastTimePrice}: any) => ({
    ...state,
    alerts: state.alerts.map((alert: IAlert) => {
      if (alert.index === index) {
        // do not update too often, max every 10 mins
        if (
          (alert.lastTimePriceCachedAt || 0) <
          Math.floor(Date.now() / 1000) - 600
        ) {
          const alertBuf = {
            ...alert,
            lastTimePriceCache: lastTimePrice,
            lastTimePriceCachedAt: Math.floor(Date.now() / 1000),
          };
          return alertBuf;
        } else {
          return alert;
        }
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
  D = UPDATE_LAST_TIME_PRICE,
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

interface IActionD {
  type: ActionTypes.D;
  payload: any;
}

type IAction = IActionA | IActionB | IActionC | IActionD;

// reducer
export default function (state = initialState, action: IAction) {
  const handler = actionHandler[action.type];

  return handler ? handler(state, action) : state;
}
