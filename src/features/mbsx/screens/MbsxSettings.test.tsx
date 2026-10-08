import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxReducer from '../mbsxSlice';
import MbsxSettings from './MbsxSettings';
import {addCaCert, applyConfig, getInfo, readConfig} from '../adapter';

jest.mock('@notifee/react-native', () => ({}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const listeners: Record<string, () => void> = {};
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: (event: string, listener: () => void) => {
      listeners[event] = listener;
      return () => {};
    },
    navigate: mockNavigate,
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
  getInfo: jest.fn(() => null),
  isRunning: () => true,
  listCaCerts: jest.fn(() => []),
  readConfig: jest.fn(),
  removeCaCert: jest.fn(),
  rescanDeposits: jest.fn(),
  writeConfig: jest.fn(),
}));

jest.mock('../useKeyboardHeight', () => ({useKeyboardHeight: () => 0}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const makeStore = () =>
  configureStore({
    reducer: {
      mbsx: mbsxReducer,
      settings: (state = {torEnabled: false}) => state,
    },
  });

const renderSettings = (store = makeStore()) => {
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
  bridge_host: 'wss://glue:1',
  bridge_pubkey: `02${'ab'.repeat(32)}`,
  coins: {part: {enabled: true, electrumx}},
});

describe('MbsxSettings servers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1'}])),
    );
  });

  it('sums up the servers of each coin and opens its list', async () => {
    (getInfo as jest.Mock).mockReturnValue({
      coins: {
        PART: {
          electrum_servers: [
            {url: 'tcp://a:1', state: 'active', live: true, error: ''},
            {url: 'tcp://b:2', state: 'cooldown', live: false, error: ''},
          ],
        },
      },
    });
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ...stored([
          {url: 'tcp://a:1'},
          {url: 'tcp://b:2'},
          {url: 'tcp://c:3', disabled: true},
        ]),
        max_electrum_servers: 1,
      }),
    );
    const {getByTestId} = renderSettings();
    await waitFor(() =>
      expect(getByTestId('mbsx-servers-summary-part')).toHaveTextContent(
        '1 connected · 2 enabled · keeps 1',
      ),
    );
    fireEvent.press(getByTestId('mbsx-servers-part'));
    expect(mockNavigate).toHaveBeenCalledWith('ElectrumServers', {
      coin: 'part',
    });
    (getInfo as jest.Mock).mockReturnValue(null);
  });

  it('saves the servers kept connected, and refuses fewer than one', async () => {
    const {getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    fireEvent.changeText(getByTestId('mbsx-max-electrum-servers'), '0');
    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() =>
      expect(getByTestId('mbsx-settings-error')).toHaveTextContent(
        'Servers kept connected must be a whole number, at least 1',
      ),
    );
    expect(applyConfig).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId('mbsx-max-electrum-servers'), '3');
    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(applyConfig).toHaveBeenCalled());
    expect(
      (applyConfig as jest.Mock).mock.calls[0][0].max_electrum_servers,
    ).toBe(3);
  });

  it('asks before saving over settings changed elsewhere', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1', disabled: true}])),
    );
    fireEvent.changeText(getByTestId('mbsx-max-electrum-servers'), '3');

    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('changed outside this screen');
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('reloads settings changed elsewhere when it comes back into view', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {getByTestId, getByText} = renderSettings();
    await waitFor(() =>
      expect(getByTestId('mbsx-servers-summary-part')).toHaveTextContent(
        '0 connected · 1 enabled',
      ),
    );
    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1', disabled: true}])),
    );

    await act(async () => listeners.focus());
    await waitFor(() =>
      expect(getByTestId('mbsx-servers-summary-part')).toHaveTextContent(
        '0 connected · 0 enabled · no enabled server',
      ),
    );
    expect(alert).not.toHaveBeenCalled();

    (readConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored([{url: 'tcp://a:1'}])),
    );
    fireEvent.press(getByText('Advanced'));
    fireEvent.changeText(getByTestId('mbsx-max-electrum-servers'), '3');
    await act(async () => listeners.focus());
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][0]).toBe('Settings Changed');
  });

  it('keeps unsaved edits when the section is opened again', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const store = makeStore();
    const first = renderSettings(store);
    fireEvent.press(await waitFor(() => first.getByText('Advanced')));
    fireEvent.changeText(first.getByTestId('mbsx-max-electrum-servers'), '3');
    first.unmount();

    const again = renderSettings(store);
    fireEvent.press(await waitFor(() => again.getByText('Advanced')));
    await waitFor(() => expect(readConfig).toHaveBeenCalledTimes(2));
    expect(again.getByTestId('mbsx-max-electrum-servers').props.value).toBe(
      '3',
    );
    expect(alert).not.toHaveBeenCalled();
  });

  it('leaves a failed restart for the starting screen to offer a retry', async () => {
    (applyConfig as jest.Mock).mockRejectedValueOnce(new Error('no core'));
    const store = makeStore();
    const {getByTestId, getByText} = renderSettings(store);
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    fireEvent.changeText(getByTestId('mbsx-max-electrum-servers'), '3');
    fireEvent.press(getByTestId('mbsx-settings-save'));
    await waitFor(() => expect(store.getState().mbsx.error).toBe('no core'));
    expect(getByTestId('mbsx-settings-error')).toHaveTextContent(
      'Saved, but the restart failed: no core',
    );
  });

  it('lists every certificate, and adds one for a server', async () => {
    const {listCaCerts} = jest.requireMock('../adapter');
    (listCaCerts as jest.Mock).mockReturnValue([
      {id: 1n, label: 'everyone', host: '', port: 0},
      {id: 2n, label: 'glue', host: 'glue.example', port: 9002},
    ]);
    const {getByTestId, getByText} = renderSettings();
    fireEvent.press(await waitFor(() => getByText('Advanced')));
    expect(getByText('Every Server')).toBeTruthy();
    expect(getByText('glue.example:9002')).toBeTruthy();

    fireEvent.changeText(getByTestId('mbsx-cert-label'), 'mine');
    fireEvent.changeText(getByTestId('mbsx-cert-host'), 'glue.example');
    fireEvent.changeText(getByTestId('mbsx-cert-port'), '9002');
    fireEvent.changeText(getByTestId('mbsx-cert-pem'), 'PEM');
    fireEvent.press(getByTestId('mbsx-add-cert'));
    expect(addCaCert).toHaveBeenCalledWith('mine', 'glue.example', 9002, 'PEM');
  });
});
