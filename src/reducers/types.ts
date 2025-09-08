import {ThunkAction, Action} from '@reduxjs/toolkit';
import {RootState} from '../store';
import {IBuyQuote, ISellQuote} from '../utils/tradeQuotes';
import {ITxHashWithExtraData} from './transaction';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppThunkBoolean<ReturnType = boolean> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppThunkTxHashesWithExtraData<
  ReturnType = ITxHashWithExtraData | null,
> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

export type AppThunkBuyQuote<ReturnType = Promise<IBuyQuote>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppThunkSellQuote<ReturnType = Promise<ISellQuote>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
