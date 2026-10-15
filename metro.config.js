const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const fs = require('fs');
const path = require('path');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
// A `bun link` puts the module's tree outside the app root, which metro must then watch.
const MBSX = fs.realpathSync(
  path.resolve(__dirname, 'node_modules/react-native-nitro-bsx'),
);
const MBSX_LINKED = path
  .relative(fs.realpathSync(__dirname), MBSX)
  .startsWith('..');

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
      new RegExp(`${MBSX}/android/(\\.cxx[^/]*|build)/.*`),
    ],
  },
  watchFolders: MBSX_LINKED ? [MBSX] : [],
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
