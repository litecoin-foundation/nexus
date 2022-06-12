import {ThunkAction, AnyAction} from '@reduxjs/toolkit';
import {RootState} from '../store';

export type ReduxType = string;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export interface IActionHandler {
  [reduxType: ReduxType]: (state: any, {payload}: any) => void;
}
