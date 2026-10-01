import React from 'react';
import {Alert, Keyboard} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxReducer from '../mbsxSlice';
import MbsxSettings from './MbsxSettings';
import {applyConfig, readConfig} from '../adapter';

jest.mock('@notifee/react-native', () => ({}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const listeners: Record<string, () => void> = {};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: (event: string, listener: () => void) => {
      listeners[event] = listener;
      return () => {};
    },
    navigate: jest.fn(),
  }),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

jest.mock('../adapter', () => ({
  PAY_IN_COINS: [],
  addCaCert: jest.fn(),
  applyConfig: jest.fn(() => Promise.resolve()),
  coinsWithActiveSwaps: () => new Set(),
  defaultConfig: jest.fn(),
  electrumUrlError: jest.requireActual('../adapter/config').electrumUrlError,
  getInfo: () => null,
  isRunning: () => true,
  listCaCerts: () => [],
  readConfig: jest.fn(),
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

const stored = (electrumx: object[]) => ({
  chain: 'regtest',
  debug: false,
  bridge_host: 'tcp://glue:1',
  coins: {part: {enabled: true, electrumx}},
});

describe('MbsxSettings servers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1'}])),
    );
  });

  it('takes several servers per coin, and saves a disabled one', async () => {
    const {getAllByPlaceholderText, getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));

    fireEvent.press(getByTestId('mbsx-add-server-part'));
    expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(true);
    expect(getByTestId('mbsx-server-enabled-part-1').props.value).toBe(true);
    fireEvent.changeText(
      getAllByPlaceholderText('tcp://host:port')[1],
      'tcp://b:2',
    );

    fireEvent(getByTestId('mbsx-server-enabled-part-0'), 'valueChange', false);
    expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(false);
    fireEvent(getByTestId('mbsx-server-enabled-part-0'), 'valueChange', true);
    expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(true);
    fireEvent(getByTestId('mbsx-server-enabled-part-1'), 'valueChange', false);

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(applyConfig).toHaveBeenCalledTimes(1));
    expect(
      (applyConfig as jest.Mock).mock.calls[0][0].coins.part.electrumx,
    ).toEqual([
      {url: 'tcp://a:1', disabled: false},
      {url: 'tcp://b:2', disabled: true},
    ]);
  });

  it('refuses a server url the module would drop', async () => {
    const {getAllByPlaceholderText, getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    fireEvent.changeText(
      getAllByPlaceholderText('tcp://host:port')[0],
      'tcp://b',
    );

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() =>
      expect(getByTestId('mbsx-coin-error-part')).toHaveTextContent(
        'Server url tcp://b for part must be tcp://host:port or ssl://host:port',
      ),
    );
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('asks before saving a coin with no enabled server', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    fireEvent(getByTestId('mbsx-server-enabled-part-0'), 'valueChange', false);

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('part has no enabled server');
    expect(applyConfig).not.toHaveBeenCalled();
    await act(async () => {
      alert.mock.calls[0][2]!.find(button => button.text === 'Save')!
        .onPress!();
    });
    expect(applyConfig).toHaveBeenCalledTimes(1);
  });

  it('asks before saving over settings changed elsewhere', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {getAllByPlaceholderText, getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1', disabled: true}])),
    );
    fireEvent.press(getByTestId('mbsx-add-server-part'));
    fireEvent.changeText(
      getAllByPlaceholderText('tcp://host:port')[1],
      'tcp://b:2',
    );

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('changed outside this screen');
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('reloads settings changed elsewhere when it comes back into view', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(true);
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1', disabled: true}])),
    );

    await act(async () => listeners.focus());
    await waitFor(() =>
      expect(getByTestId('mbsx-server-enabled-part-0').props.value).toBe(false),
    );
    expect(alert).not.toHaveBeenCalled();

    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1'}])),
    );
    fireEvent.press(getByTestId('mbsx-add-server-part'));
    await act(async () => listeners.focus());
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][0]).toBe('Settings changed');
  });
});
