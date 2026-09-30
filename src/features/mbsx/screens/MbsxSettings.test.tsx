import React from 'react';
import {Keyboard} from 'react-native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxReducer from '../mbsxSlice';
import MbsxSettings from './MbsxSettings';
import {applyConfig} from '../adapter';

jest.mock('@notifee/react-native', () => ({}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({addListener: () => () => {}, navigate: jest.fn()}),
}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

jest.mock('../adapter', () => ({
  PAY_IN_COINS: [],
  addCaCert: jest.fn(),
  applyConfig: jest.fn(() => Promise.resolve()),
  coinsWithActiveSwaps: () => new Set(),
  defaultConfig: jest.fn(),
  getInfo: () => null,
  isRunning: () => true,
  listCaCerts: () => [],
  readConfig: () =>
    Promise.resolve({
      chain: 'regtest',
      debug: false,
      bridge_host: 'tcp://glue:1',
      coins: {part: {enabled: true, electrumx: [{url: 'tcp://a:1'}]}},
    }),
  removeCaCert: jest.fn(),
  rescanDeposits: jest.fn(),
  writeConfig: jest.fn(),
}));

jest.spyOn(Keyboard, 'addListener').mockReturnValue({remove: jest.fn()} as any);

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const renderSettings = () => {
  const store = configureStore({
    reducer: {
      mbsx: mbsxReducer,
      settings: (state = {torEnabled: false}) => state,
    },
  });
  return render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <MbsxSettings />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
};

describe('MbsxSettings servers', () => {
  it('keeps one enabled server per coin, and saves a disabled one', async () => {
    const {
      getAllByPlaceholderText,
      getByTestId,
      getByText,
      queryByTestId,
      queryByText,
    } = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));

    fireEvent.press(getByTestId('mbsx-add-server-part'));
    getByText('Only one server per coin is supported for now');
    expect(queryByTestId('mbsx-server-enabled-part-1')).toBeNull();

    fireEvent(getByTestId('mbsx-server-enabled-part-0'), 'valueChange', false);
    expect(
      queryByText('Only one server per coin is supported for now'),
    ).toBeNull();
    fireEvent.press(getByTestId('mbsx-add-server-part'));
    expect(getByTestId('mbsx-server-enabled-part-1').props.value).toBe(true);
    fireEvent.changeText(
      getAllByPlaceholderText('tcp://host:port')[1],
      'tcp://b:2',
    );

    fireEvent(getByTestId('mbsx-server-enabled-part-0'), 'valueChange', true);
    getByText('Only one server per coin is supported for now');
    expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(false);

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(applyConfig).toHaveBeenCalledTimes(1));
    expect(
      (applyConfig as jest.Mock).mock.calls[0][0].coins.part.electrumx,
    ).toEqual([{url: 'tcp://a:1', disabled: true}, {url: 'tcp://b:2'}]);
  });
});
