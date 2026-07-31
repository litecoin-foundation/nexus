/**
 * @format
 */
import {Buffer} from '@craftzdog/react-native-buffer';
window.Buffer = Buffer;
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {startExternalMemoryLog} from './src/utils/memoryDiagnostics';
import {PERF_HARNESS} from './src/config/perfHarness';

// temporary while diagnosing the external-memory OOM (glass-perf-plan.md).
// Gated: it is an uncleared 10s interval that wakes the JS thread forever,
// including backgrounded.
if (PERF_HARNESS) {
  startExternalMemoryLog();
}

AppRegistry.registerComponent(appName, () => App);
