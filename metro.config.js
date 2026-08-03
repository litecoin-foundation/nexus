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
    // The blockList below hides the linked module's own node_modules, and metro
    // resolves relative to the importing file, so anything its code reaches for
    // must be mapped back here. @babel/runtime is needed because this app's
    // babel transform rewrites the module's `export *` through a runtime
    // helper — the import does not appear in the file on disk.
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react-native-nitro-modules': path.resolve(
        __dirname,
        'node_modules/react-native-nitro-modules',
      ),
      '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
    },
    // The symlinked module tree carries its own copies of react, react-native
    // and (under example/) react-navigation. A second copy resolves fine and
    // then fails at runtime with duplicate contexts and hook-order errors.
    blockList: [
      defaultConfig.resolver.blockList,
      new RegExp(`${MBSX}/example/.*`),
      new RegExp(`${MBSX}/node_modules/.*`),
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
