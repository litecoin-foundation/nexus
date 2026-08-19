/**
 * @format
 */
import {Buffer} from '@craftzdog/react-native-buffer';
window.Buffer = Buffer;
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import {WAKE_TASK_NAME} from 'react-native-nitro-bsx';
import App from './App';
import {name as appName} from './app.json';
import {runWakeTask} from './src/features/mbsx/adapter/wake';

AppRegistry.registerComponent(appName, () => App);

// A swap's timelocks run whether the app does or not, so the module wakes the
// device for them. The alarm has no ui behind it: this is what gives it js.
AppRegistry.registerHeadlessTask(WAKE_TASK_NAME, () => runWakeTask);
