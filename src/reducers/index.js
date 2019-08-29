import { combineReducers } from 'redux';
import onboarding from './onboarding';
import lightning from './lightning';
import balance from './balance';
import info from './info';
import transaction from './transaction';
import payment from './payment';
import address from './address';
import ticker from './ticker';
import invoice from './invoice';
import channels from './channels';
import authpad from './authpad';
import buy from './buy';

export default combineReducers({
  onboarding,
  lightning,
  balance,
  info,
  transaction,
  payment,
  address,
  ticker,
  invoice,
  channels,
  authpad,
  buy
});
