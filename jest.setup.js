/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock expo modules
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  SECURITY_LEVEL: {},
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('test-device-id')),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '15.0'),
  getBrand: jest.fn(() => 'Apple'),
  getModel: jest.fn(() => 'iPhone'),
}));

// Mock react-native-share
jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}) => children,
  SafeAreaConsumer: ({children}) => children({top: 0, bottom: 0, left: 0, right: 0}),
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  useSafeAreaFrame: () => ({x: 0, y: 0, width: 375, height: 812}),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-turbo-lndltc
jest.mock('react-native-turbo-lndltc', () => ({
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    sendCommand: jest.fn(),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({isConnected: true})),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  getCountry: jest.fn(() => 'US'),
  getLocales: jest.fn(() => [{countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false}]),
  getCurrencies: jest.fn(() => ['USD']),
  getTimeZone: jest.fn(() => 'America/New_York'),
  uses24HourClock: jest.fn(() => false),
  usesMetricSystem: jest.fn(() => false),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native-quick-crypto
jest.mock('react-native-quick-crypto', () => ({
  default: {
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hash'),
    })),
    createHmac: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hmac'),
    })),
    randomBytes: jest.fn(() => Buffer.from('mocked-random-bytes')),
  },
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hmac'),
  })),
  randomBytes: jest.fn(() => Buffer.from('mocked-random-bytes')),
}));

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  default: {
    fs: {
      dirs: {
        DocumentDir: '/mock/documents',
        CacheDir: '/mock/cache',
      },
      exists: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn(),
    },
    fetch: jest.fn(),
  },
}));

// Global test setup
global.__DEV__ = true;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // warn: jest.fn(),
  // error: jest.fn(),
  // log: jest.fn(),
};

// Set up fake timers
jest.useFakeTimers();
