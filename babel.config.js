const ReactCompilerConfig = {
  target: '19',
};

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['babel-plugin-react-compiler', ReactCompilerConfig],
    ['transform-remove-console'],
    [
      'module-resolver',
      {
        alias: {
          crypto: 'react-native-quick-crypto',
          stream: 'stream-browserify',
          buffer: '@craftzdog/react-native-buffer',
        },
      },
    ],
    ['react-native-reanimated/plugin'],
  ],
};
