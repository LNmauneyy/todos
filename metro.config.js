// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a wasm binary; Metro needs to treat
// .wasm as a bundleable asset for `expo start --web` / `expo export -p web`.
config.resolver.assetExts.push('wasm');

module.exports = config;
