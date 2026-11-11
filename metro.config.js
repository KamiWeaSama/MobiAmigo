
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Desactivar Package Exports para evitar problemas
// de resolución con algunas versiones de Firebase.
config.resolver.unstable_enablePackageExports = false;

config.resolver.sourceExts.push('cjs');

module.exports = config;
