import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {NavigationContainer} from '@react-navigation/native';
import Sell from './Sell';
import {ScreenSizeContext} from '../../context/screenSize';
// import {log} from 'console';

// NOTE: mock the redux store with the state that
// has values which are being tested
const createMockStore = (initialState: any) => {
  const rootReducer = (state = initialState) => state;
  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
  });
};

jest.mock('react-native-turbo-lndltc', () => ({
  estimateFee: jest.fn(),
}));

// NOTE: if TranslateText returns unrecognized textkeys we know to fail a test
jest.mock('../../components/TranslateText', () => {
  return function MockTranslateText({
    textKey,
    textValue,
    interpolationObj,
    children,
  }: any) {
    if (textValue) {
      return textValue;
    }
    if (textKey === 'n_ltc' && interpolationObj?.amount) {
      return `${interpolationObj.amount}`;
    }
    if (
      textKey === 'for_total' &&
      interpolationObj?.total &&
      interpolationObj?.currencySymbol
    ) {
      return `${interpolationObj.currencySymbol}${interpolationObj.total}`;
    }
    return textKey || children;
  };
});

// NOTE: mock child components
jest.mock('../Numpad/BuyPad', () => 'BuyPad');
jest.mock('../Buttons/BlueButton', () => 'BlueButton');
jest.mock('../Buttons/WhiteButton', () => 'WhiteButton');

// NOTE: mock device and its nav
const mockScreenSize = {
  width: 375,
  height: 812,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  navigateDeprecated: jest.fn(),
  preload: jest.fn(),
} as any;

describe('Sell Component', () => {
  it('renders correct LTC amount text on line 317', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000',
      },
      input: {
        amount: '1.5',
        fiatAmount: '75.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: '100.00',
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: {
          ltcAmount: 1.5,
          fiatAmount: 100.0,
        },
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const component = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    const json = component.toJSON();
    const jsonString = JSON.stringify(json);
    // NOTE: use this to debug the json view of the rendered component
    // log('Rendered component:', JSON.stringify(json, null, 2));
    try {
      expect(jsonString).toContain('1.5');
      expect(jsonString).toContain(' LTC');
      expect(jsonString).toContain('$100');
    } catch (error) {
      component.debug();
      throw error;
    }
  });

  it('shows 0.00 for LTC amount when amount is empty', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000',
      },
      input: {
        amount: '',
        fiatAmount: '',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        availableAmount: '2.0',
        availableQuote: '100.00',
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: {
          ltcAmount: 1.5,
          fiatAmount: 100.0,
        },
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const component = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    const json = component.toJSON();
    const jsonString = JSON.stringify(json);
    try {
      expect(jsonString).toContain('0.00');
    } catch (error) {
      component.debug();
      throw error;
    }
  });

  it('shows amount (1.5 LTC and $75) when sellQuote is not available', () => {
    const mockState = {
      balance: {
        confirmedBalance: '2000000000',
      },
      input: {
        amount: '1.5',
        fiatAmount: '75.00',
        toggleLTC: true,
      },
      settings: {
        currencySymbol: '$',
      },
      buy: {
        currencySymbol: '$',
        isSellAllowed: true,
        isMoonpayCustomer: true,
        isOnramperCustomer: false,
        proceedToGetSellLimits: false,
        sellQuote: null,
        sellLimits: {
          minLTCSellAmount: '0.01',
          maxLTCSellAmount: '10.0',
        },
        sellQuotes: [],
        sellLimitsStatus: 'success',
        sellQuoteStatus: 'success',
      },
      ticker: {},
    };

    const store = createMockStore(mockState);

    const component = render(
      <Provider store={store}>
        <NavigationContainer>
          <ScreenSizeContext.Provider value={mockScreenSize}>
            <Sell navigation={mockNavigation} />
          </ScreenSizeContext.Provider>
        </NavigationContainer>
      </Provider>,
    );

    const json = component.toJSON();
    const jsonString = JSON.stringify(json);
    try {
      expect(jsonString).toContain('1.5');
      expect(jsonString).toContain(' LTC');
      expect(jsonString).toContain('$75');
    } catch (error) {
      component.debug();
      throw error;
    }
  });
});
