import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxReducer, {draftLoaded} from '../mbsxSlice';
import ElectrumServer from './ElectrumServer';
import {
  addCaCert,
  applyConfig,
  getInfo,
  listCaCerts,
  listPinnedCerts,
  readConfig,
  removePinnedCert,
} from '../adapter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({addListener: () => () => {}, navigate: jest.fn()}),
  useFocusEffect: (effect: () => void | (() => void)) =>
    require('react').useEffect(effect, [effect]),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));

jest.mock('../network', () => ({getNetwork: () => 'mainnet'}));

jest.mock('../adapter', () => ({
  addCaCert: jest.fn(),
  applyConfig: jest.fn(() => Promise.resolve()),
  defaultConfig: jest.fn(),
  electrumUrlError: jest.requireActual('../adapter/config').electrumUrlError,
  getInfo: jest.fn(() => null),
  isRunning: () => true,
  listCaCerts: jest.fn(() => []),
  listPinnedCerts: jest.fn(() => []),
  readConfig: jest.fn(),
  removeCaCert: jest.fn(),
  removePinnedCert: jest.fn(),
}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const draft = (electrumx: object[]) => ({
  chain: 'mainnet',
  debug: false,
  bridge_host: 'tcp://glue:1',
  coins: {part: {enabled: true, electrumx}},
});

const navigate = jest.fn();

const renderServer = (config: ReturnType<typeof draft>, index = 0) => {
  (readConfig as jest.Mock).mockImplementation(() => Promise.resolve(config));
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  const json = JSON.stringify(config);
  store.dispatch(
    draftLoaded({config: config as any, savedJson: json, storedJson: json}),
  );
  const view = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <ElectrumServer
          navigation={{navigate} as any}
          route={{params: {coin: 'part', index}} as any}
        />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  return {store, view};
};

describe('ElectrumServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the status, version and last error', () => {
    (getInfo as jest.Mock).mockReturnValue({
      coins: {
        PART: {
          electrum_servers: [
            {
              url: 'ssl://a:1',
              state: 'active',
              live: true,
              error: 'protocol not supported',
              version: 'ElectrumX 1.16.1',
            },
          ],
        },
      },
    });
    const {view} = renderServer(draft([{url: 'ssl://a:1'}]));
    expect(view.getByTestId('mbsx-server-status')).toHaveTextContent(
      'Connected · ElectrumX 1.16.1',
    );
    expect(view.getByTestId('mbsx-server-last-error')).toHaveTextContent(
      'protocol not supported',
    );
    expect(view.queryByTestId('mbsx-server-mode-none')).toBeNull();
    (getInfo as jest.Mock).mockReturnValue(null);
  });

  it('edits the certificate check and verbose transactions, then saves', async () => {
    const {view} = renderServer(draft([{url: 'ssl://a:1'}]));
    expect(view.queryByTestId('mbsx-server-verify-hostname')).toBeNull();
    fireEvent.press(view.getByTestId('mbsx-server-mode-strict'));
    fireEvent(
      view.getByTestId('mbsx-server-verify-hostname'),
      'valueChange',
      false,
    );
    fireEvent.press(view.getByTestId('mbsx-server-advanced'));
    fireEvent(view.getByTestId('mbsx-server-verbose'), 'valueChange', false);
    fireEvent.press(view.getByTestId('mbsx-server-save'));
    await waitFor(() => expect(applyConfig).toHaveBeenCalledTimes(1));
    expect(
      (applyConfig as jest.Mock).mock.calls[0][0].coins.part.electrumx,
    ).toEqual([
      {
        url: 'ssl://a:1',
        verify_certs_mode: 'strict',
        verify_hostname: false,
        haveverbosetx: false,
      },
    ]);
  });

  it('refuses a url the module would drop', async () => {
    const {view} = renderServer(draft([{url: 'tcp://a:1'}]));
    fireEvent.changeText(view.getByTestId('mbsx-server-url'), 'tcp://b');
    expect(view.getByTestId('mbsx-server-url-error')).toHaveTextContent(
      'Server url must be tcp://host:port or ssl://host:port',
    );
    fireEvent.press(view.getByTestId('mbsx-server-save'));
    await waitFor(() =>
      expect(view.getByTestId('mbsx-server-error')).toHaveTextContent(
        'Server url tcp://b for part must be tcp://host:port or ssl://host:port',
      ),
    );
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('forgets the pinned certificate after asking', () => {
    const alert = jest.spyOn(Alert, 'alert');
    (listPinnedCerts as jest.Mock).mockReturnValue([
      {
        host: 'a',
        port: 1,
        fingerprint: 'aabbcc',
        first_seen: 0,
        ca_signed: false,
      },
      {host: 'z', port: 9, fingerprint: 'ffff', first_seen: 0, ca_signed: true},
    ]);
    const {view} = renderServer(draft([{url: 'ssl://a:1'}]));
    expect(view.getByTestId('mbsx-server-pin')).toHaveTextContent('aa:bb:cc');
    expect(view.getByText('Since 1970-01-01, self-signed')).toBeTruthy();
    fireEvent.press(view.getByTestId('mbsx-server-forget-pin'));
    expect(removePinnedCert).not.toHaveBeenCalled();
    act(() => {
      alert.mock.calls[0][2]!.find(button => button.text === 'Forget')!
        .onPress!();
    });
    expect(removePinnedCert).toHaveBeenCalledWith('a', 1);
  });

  it('lists and adds CA certificates for this server only', () => {
    (listCaCerts as jest.Mock).mockReturnValue([
      {id: 1n, label: 'mine', host: 'a', port: 1},
      {id: 2n, label: 'other', host: 'b', port: 2},
      {id: 3n, label: 'every server', host: '', port: 0},
    ]);
    const {view} = renderServer(draft([{url: 'ssl://a:1'}]));
    expect(view.getByText('mine')).toBeTruthy();
    expect(view.queryByText('other')).toBeNull();
    expect(view.queryByText('every server')).toBeNull();
    fireEvent.changeText(view.getByTestId('mbsx-server-ca-label'), 'new');
    fireEvent.changeText(view.getByTestId('mbsx-server-ca-pem'), 'PEM');
    fireEvent.press(view.getByTestId('mbsx-server-add-ca'));
    expect(addCaCert).toHaveBeenCalledWith('new', 'a', 1, 'PEM');
  });

  it('removes the server after asking and goes back to the list', () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {store, view} = renderServer(
      draft([{url: 'tcp://a:1'}, {url: 'tcp://b:2'}]),
      1,
    );
    fireEvent.press(view.getByTestId('mbsx-server-advanced'));
    fireEvent.press(view.getByTestId('mbsx-server-remove'));
    act(() => {
      alert.mock.calls[0][2]!.find(button => button.text === 'Remove')!
        .onPress!();
    });
    expect(store.getState().mbsx.settingsDraft?.coins.part.electrumx).toEqual([
      {url: 'tcp://a:1'},
    ]);
    expect(navigate).toHaveBeenCalledWith('ElectrumServers', {coin: 'part'});
  });
});
