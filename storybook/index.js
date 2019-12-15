import {AppRegistry} from 'react-native';
import {getStorybookUI, configure} from '@storybook/react-native';

import {name as appName} from '../app.json';
import './rn-addons';
import {loadStories} from './storyLoader';

configure(() => {
  loadStories();
}, module);

const StorybookUIRoot = getStorybookUI({});

AppRegistry.registerComponent(appName, () => StorybookUIRoot);

export default StorybookUIRoot;
