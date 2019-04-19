import { combineReducers } from 'redux';
import onboarding from './onboarding';
import lightning from './lightning';
import balance from './balance';
import info from './info';
import transaction from './transaction';

export default combineReducers({ onboarding, lightning, balance, info, transaction });
