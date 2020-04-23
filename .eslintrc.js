module.exports = {
  extends: ["plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2017,
  },
  env: {
    es6: true,
  },
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
      ],
      rules: {
        "no-useless-constructor": "off",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/prefer-readonly": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/explicit-function-return-type": [
          "error",
          { allowExpressions: true },
        ],
        "@typescript-eslint/member-delimiter-style": "off", // Conflicts with Prettier
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { ignoreRestSiblings: true },
        ],
      },
      env: {
        jest: true,
      },
    },
  ],
};
