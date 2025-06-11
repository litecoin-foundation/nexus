const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    unstable_enablePackageExports: true,
  },
};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
const finalConfig = mergeConfig(getDefaultConfig(__dirname), config);

module.exports = withStorybook(finalConfig, {
  // Set to false to remove storybook specific options
  // you can also use a env variable to set this
  enabled: false,
  // Path to your storybook config
  configPath: path.resolve(__dirname, './.storybook'),
});
