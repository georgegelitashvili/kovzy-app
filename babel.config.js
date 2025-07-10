module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Other plugins can go here
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
      }],
      // THIS MUST BE THE LAST PLUGIN IN THE ARRAY!
      'react-native-reanimated/plugin',
    ],
  };
};