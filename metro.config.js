const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'mp3', 'ttf', 'otf'];

module.exports = config;