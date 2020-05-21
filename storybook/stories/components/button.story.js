/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View} from 'react-native';
import {storiesOf} from '@storybook/react-native';
import {action} from '@storybook/addon-actions';

import CenterView from '../CenterView';
import BlueButton from '../../../src/components/Buttons/BlueButton';
import BlueClearButton from '../../../src/components/Buttons/BlueClearButton';
import BlueFatButton from '../../../src/components/Buttons/BlueFatButton';

storiesOf('BlueButton', module)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <BlueButton value="Lorem ipsum..." onPress={action('clicked-text')} />
  ));

storiesOf('BlueClearButton', module)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <BlueClearButton value="Lorem ipsum..." onPress={action('clicked-text')} />
  ));

storiesOf('BlueFatButton', module)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <View style={{height: 100, width: '100%'}}>
      <BlueFatButton value="Lorem ipsum..." onPress={action('clicked-text')} />
    </View>
  ));
