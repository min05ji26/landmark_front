module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // plugins: ['expo-router/babel'],  <-- 이 줄이 있으면 절대 안 됩니다!
  };
};