const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'mjs' to the list of extensions Metro should resolve
config.resolver.sourceExts.push('mjs');

module.exports = config;
