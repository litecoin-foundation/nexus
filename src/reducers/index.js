import { combineReducers } from 'redux';
import onboarding from './onboarding';
import lightning from './lightning';
import balance from './balance';
import info from './info';
import transaction from './transaction';
import payment from './payment';
import address from './address';
import ticker from './ticker';

export default combineReducers({
  onboarding,
  lightning,
  balance,
  info,
  transaction,
  payment,
  address,
  ticker
});
