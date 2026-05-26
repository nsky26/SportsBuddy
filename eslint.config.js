const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/web-build/**",
      "**/dist/**",
      "**/.agents/**"
    ]
  },
  ...expoConfig,
];
