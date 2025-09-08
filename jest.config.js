module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@reduxjs/toolkit|@shopify/flash-list|@shopify/react-native-skia|react-native-.*|@react-navigation|react-i18next|i18next|expo-.*|@expo|lottie-react-native|@bitcoinerlab|@craftzdog|@dr.pogodin|@flexa|@noble|@notifee|@react-native-async-storage|@react-native-clipboard|@react-native-community|@react-native-segmented-control|@shopify|react-native-.*)/)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/.expo/',
  ],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};
