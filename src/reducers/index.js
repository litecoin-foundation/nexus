import { combineReducers } from 'redux';
import onboarding from './onboarding';
import lnd from './lnd';

export default combineReducers({ onboarding, lnd });
