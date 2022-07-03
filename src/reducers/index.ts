import {combineReducers} from 'redux';
import onboarding from './onboarding';
import lightning from './lightning';
import balance from './balance';
import info from './info';
import transaction from './transaction';
import address from './address';
import ticker from './ticker';
import invoice from './invoice';
import channels from './channels';
import authpad from './authpad';
import buy from './buy';
import authentication from './authentication';
import chart from './chart';
import input from './input';
import alerts from './alerts';
import settings from './settings';
import deeplinks from './deeplinks';
import watchtower from './watchtower';

export default combineReducers({
  onboarding,
  lightning,
  balance,
  info,
  transaction,
  address,
  ticker,
  invoice,
  channels,
  authpad,
  buy,
  authentication,
  chart,
  input,
  alerts,
  settings,
  deeplinks,
  watchtower,
});
