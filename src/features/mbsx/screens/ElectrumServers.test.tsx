import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import {ScreenSizeContext} from '../../../context/screenSize';
import mbsxReducer, {draftLoaded} from '../mbsxSlice';
import ElectrumServers from './ElectrumServers';
import {applyConfig, getInfo, readConfig} from '../adapter';

jest.mock('../useKeyboardHeight', () => ({useKeyboardHeight: () => 0}));
jest.mock('../../../components/Buttons/HeaderButton', () => () => null);
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({addListener: () => () => {}, navigate: jest.fn()}),
  useFocusEffect: (effect: () => void | (() => void)) =>
    require('react').useEffect(effect, [effect]),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
}));

jest.mock('../network', () => ({getNetwork: () => 'regtest'}));

jest.mock('../adapter', () => ({
  applyConfig: jest.fn(() => Promise.resolve()),
  defaultConfig: jest.fn(),
  electrumUrlError: jest.requireActual('../adapter/config').electrumUrlError,
  getInfo: jest.fn(() => null),
  isRunning: () => true,
  readConfig: jest.fn(),
}));

const screenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const draft = (electrumx: object[]) => ({
  chain: 'regtest',
  debug: false,
  bridge_host: 'tcp://glue:1',
  coins: {part: {enabled: true, electrumx}},
});

const navigate = jest.fn();

const renderList = (config: ReturnType<typeof draft>) => {
  (readConfig as jest.Mock).mockImplementation(() => Promise.resolve(config));
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  const json = JSON.stringify(config);
  store.dispatch(
    draftLoaded({config: config as any, savedJson: json, storedJson: json}),
  );
  const view = render(
    <Provider store={store}>
      <ScreenSizeContext.Provider value={screenSize}>
        <ElectrumServers
          navigation={{navigate} as any}
          route={{params: {coin: 'part'}} as any}
        />
      </ScreenSizeContext.Provider>
    </Provider>,
  );
  return {store, view};
};

describe('ElectrumServers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('labels each server by what the module made of it', () => {
    (getInfo as jest.Mock).mockReturnValue({
      coins: {
        PART: {
          electrum_servers: [
            {url: 'tcp://a:1', state: 'active', live: true, error: ''},
            {
              url: 'tcp://b:2',
              state: 'cooldown',
              live: false,
              error: 'connect failed',
            },
            {url: 'tcp://e:5', state: 'idle', live: false, error: ''},
          ],
        },
      },
    });
    const {view} = renderList(
      draft([
        {url: 'tcp://a:1'},
        {url: 'tcp://b:2'},
        {url: 'tcp://c:3', disabled: true},
        {url: 'tcp://d:4'},
        {url: 'tcp://e:5'},
      ]),
    );
    const label = (i: number) => view.getByTestId(`mbsx-server-state-${i}`);
    expect(label(0)).toHaveTextContent('Connected');
    expect(label(1)).toHaveTextContent('Cooling down');
    expect(view.getByText('Connect failed')).toBeTruthy();
    expect(label(2)).toHaveTextContent('Disabled');
    expect(label(3)).toHaveTextContent('Not started');
    expect(label(4)).toHaveTextContent('Standby');
    (getInfo as jest.Mock).mockReturnValue(null);
  });

  it('saves the enable switches and the coin cap, refusing fewer than one', async () => {
    const {view} = renderList(draft([{url: 'tcp://a:1'}, {url: 'tcp://b:2'}]));
    fireEvent(view.getByTestId('mbsx-server-enabled-1'), 'valueChange', false);
    fireEvent.changeText(view.getByTestId('mbsx-servers-cap'), '0');
    fireEvent.press(view.getByTestId('mbsx-servers-save'));
    await waitFor(() =>
      expect(view.getByTestId('mbsx-servers-error')).toHaveTextContent(
        'Servers kept connected for part must be a whole number, at least 1',
      ),
    );
    expect(applyConfig).not.toHaveBeenCalled();

    fireEvent.changeText(view.getByTestId('mbsx-servers-cap'), '1');
    fireEvent.press(view.getByTestId('mbsx-servers-save'));
    await waitFor(() => expect(applyConfig).toHaveBeenCalledTimes(1));
    const saved = (applyConfig as jest.Mock).mock.calls[0][0].coins.part;
    expect(saved.max_electrum_servers).toBe(1);
    expect(saved.electrumx).toEqual([
      {url: 'tcp://a:1'},
      {url: 'tcp://b:2', disabled: true},
    ]);
  });

  it('asks before saving a coin with no enabled server', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const {view} = renderList(draft([{url: 'tcp://a:1'}]));
    fireEvent(view.getByTestId('mbsx-server-enabled-0'), 'valueChange', false);
    fireEvent.press(view.getByTestId('mbsx-servers-save'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][1]).toContain('part has no enabled server');
    expect(applyConfig).not.toHaveBeenCalled();
    await act(async () => {
      alert.mock.calls[0][2]!.find(button => button.text === 'Save')!
        .onPress!();
    });
    await waitFor(() => expect(applyConfig).toHaveBeenCalledTimes(1));
  });

  it('adds a server and opens it', () => {
    const {store, view} = renderList(draft([{url: 'tcp://a:1'}]));
    fireEvent.press(view.getByTestId('mbsx-add-server'));
    expect(store.getState().mbsx.settingsDraft?.coins.part.electrumx).toEqual([
      {url: 'tcp://a:1'},
      {url: ''},
    ]);
    expect(navigate).toHaveBeenCalledWith('ElectrumServer', {
      coin: 'part',
      index: 1,
    });
  });
});
