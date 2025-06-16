const ReactCompilerConfig = {
  target: '19',
};

module.exports = function (api) {
  const env = api.env();
  api.cache(true);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ['babel-plugin-react-compiler', ReactCompilerConfig],
      ...(env === 'development' ? [] : ['transform-remove-console']),
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
};
