import {combineReducers} from 'redux';
import onboarding from './onboarding';
import lightning from './lightning';
import balance from './balance';
import info from './info';
import transaction from './transaction';
import address from './address';
import ticker from './ticker';
import authpad from './authpad';
import buy from './buy';
import authentication from './authentication';
import chart from './chart';
import input from './input';
import alerts from './alerts';
import settings from './settings';
import deeplinks from './deeplinks';
import errors from './errors';
import cart from './cart';

export default combineReducers({
  onboarding,
  lightning,
  balance,
  info,
  transaction,
  address,
  ticker,
  authpad,
  buy,
  authentication,
  chart,
  input,
  alerts,
  settings,
  deeplinks,
  errors,
  cart,
});
