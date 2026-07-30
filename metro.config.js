const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
// Dev-linked via `bun link`, so the source lives outside the app root.
const MBSX = path.resolve(__dirname, '../iota_react-native-nitro-bsx');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    unstable_enablePackageExports: true,
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react-native-nitro-modules': path.resolve(
        __dirname,
        'node_modules/react-native-nitro-modules',
      ),
    },
    // The symlinked module ships its own react/react-native; a second copy
    // resolves fine and then fails at runtime.
    blockList: [
      defaultConfig.resolver.blockList,
      new RegExp(`${MBSX}/node_modules/(react|react-native)/.*`),
    ],
  },
  watchFolders: [MBSX],
};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
const finalConfig = mergeConfig(defaultConfig, config);

module.exports = withStorybook(finalConfig, {
  // Set to false to remove storybook specific options
  // you can also use a env variable to set this
  enabled: false,
  // Path to your storybook config
  configPath: path.resolve(__dirname, './.storybook'),
});
