import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURGE} from 'redux-persist';
import {AppThunk} from './types';

// types
export enum PopupActionType {
  CloseModal = 'CloseModal',
  GoToScreen = 'GoToScreen',
  OpenWebview = 'OpenWebview',
}

interface ICloseModalAction {
  actionType: PopupActionType.CloseModal;
  actionMeta?: undefined;
}

interface IGoToScreenAction {
  actionType: PopupActionType.GoToScreen;
  actionMeta: {
    stack: string;
    screen: string;
    routeParams?: {[key: string]: any};
  };
}

interface IOpenWebviewAction {
  actionType: PopupActionType.OpenWebview;
  actionMeta: {
    webUrl: string;
  };
}

type PopupAction = ICloseModalAction | IGoToScreenAction | IOpenWebviewAction;

export type IPopup = {
  title: string;
  text: string;
  onAction: string;
  startDate: number;
  endDate?: number;
  frequency: string;
  priority: number;
  isFired: boolean;
  firedAt: number;
} & PopupAction;

interface IPopupScheduleState {
  popups: IPopup[];
}

// initial state
const initialState: IPopupScheduleState = {
  popups: [],
};

// slice
export const popupScheduleSlice = createSlice({
  name: 'popupschedule',
  initialState,
  reducers: {
    setPopups: (state, action: PayloadAction<IPopup[]>) => ({
      ...state,
      popups: action.payload,
    }),
    addPopup: (state, action: PayloadAction<IPopup>) => ({
      ...state,
      popups: [...state.popups, action.payload],
    }),
    removePopup: (state, action: PayloadAction<number>) => ({
      ...state,
      popups: state.popups.filter((_, index) => index !== action.payload),
    }),
    markPopupFired: (
      state,
      action: PayloadAction<{index: number; firedAt: number}>,
    ) => ({
      ...state,
      popups: state.popups.map((popup, index) =>
        index === action.payload.index
          ? {...popup, isFired: true, firedAt: action.payload.firedAt}
          : popup,
      ),
    }),
  },
  extraReducers: builder => {
    builder.addCase(PURGE, () => {
      return initialState;
    });
  },
});

export const {setPopups, addPopup, removePopup, markPopupFired} =
  popupScheduleSlice.actions;

// thunks
export const firePopup =
  (): AppThunk<IPopup | null> => (dispatch, getState) => {
    const {popups} = getState().popupschedule;
    const now = Math.floor(Date.now() / 1000);

    const duePopups = popups
      .map((popup, index) => ({popup, index}))
      .filter(({popup}) => {
        if (popup.isFired) {
          return false;
        }
        if (now < popup.startDate) {
          return false;
        }
        if (popup.endDate && now > popup.endDate) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.popup.priority - b.popup.priority);

    if (duePopups.length > 0) {
      // dispatch(markPopupFired({index: duePopups[0].index, firedAt: now}));
      dispatch(removePopup(duePopups[0].index));
      return duePopups[0].popup;
    }

    return null;
  };

export default popupScheduleSlice.reducer;
