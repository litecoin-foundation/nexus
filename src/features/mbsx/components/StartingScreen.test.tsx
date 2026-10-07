import React from 'react';
import {act, fireEvent, render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

import mbsxReducer, {setError, setRunning, setStartupStep} from '../mbsxSlice';
import StartingScreen from './StartingScreen';

const renderScreen = (onRetry = jest.fn()) => {
  const store = configureStore({reducer: {mbsx: mbsxReducer}});
  const view = render(
    <Provider store={store}>
      <StartingScreen onRetry={onRetry} />
    </Provider>,
  );
  return {store, view, onRetry};
};

describe('StartingScreen', () => {
  it('names the step the module is on', () => {
    const {store, view} = renderScreen();
    expect(view.getByText('Starting BasicSwap')).toBeTruthy();
    expect(view.queryByTestId('mbsx-starting-step')).toBeNull();

    act(() => {
      store.dispatch(setStartupStep('key'));
    });
    expect(view.getByText('Deriving the swap key')).toBeTruthy();
    act(() => {
      store.dispatch(setStartupStep('servers'));
    });
    expect(view.getByText('Connecting to servers')).toBeTruthy();
  });

  it('shows a failed start with a retry', () => {
    const {store, view, onRetry} = renderScreen();
    act(() => {
      store.dispatch(setError('mbsx failed to initialise'));
    });
    expect(view.getByText('Swaps did not start')).toBeTruthy();
    expect(view.getByText('mbsx failed to initialise')).toBeTruthy();
    fireEvent.press(view.getByTestId('mbsx-starting-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('stays up while the swap server connects', () => {
    const {store, view} = renderScreen();
    act(() => {
      store.dispatch(setStartupStep('bridge'));
      store.dispatch(setRunning(true));
    });
    expect(view.getByText('Connecting to the swap server')).toBeTruthy();
    act(() => {
      store.dispatch(setStartupStep('ready'));
    });
    expect(view.queryByTestId('mbsx-starting')).toBeNull();
  });

  it('is gone once the module is running', () => {
    const {store, view} = renderScreen();
    act(() => {
      store.dispatch(setRunning(true));
    });
    expect(view.queryByTestId('mbsx-starting')).toBeNull();
  });
});
