"use strict";

const path = require("path");

const enableSourceMaps = false;

module.exports = {
  mode: "production",
  target: "node",
  entry: "./src/index.ts",
  devtool: enableSourceMaps ? "source-map" : undefined,
  output: {
    filename: "bundle.js",
    libraryTarget: "commonjs",
    path: path.resolve(__dirname, "dist-webpack"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".json"],
    modules: ["node_modules", "../../node_modules"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.webpack.json",
          transpileOnly: true, // This goes a lot faster and it's safe since we have a separate build step
        },
      },
    ],
  },
  externals: [
    // Packages we assume to be well-known to GCP/Firebase functions => fast to load => no need to bundle
    // ...Or packages that give trouble with Webpack
    "firebase-admin",
    "firebase-functions",
    "express",
    "apollo-server-express",
    "graphql",
  ],
};
