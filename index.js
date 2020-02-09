import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';

// polyfills
process.nextTick = setImmediate;

AppRegistry.registerComponent(appName, () => App);
