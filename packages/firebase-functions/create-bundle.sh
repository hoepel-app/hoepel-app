#!/bin/bash
set -euxo pipefail

echo "Removing existing Webpack dist folder..."
rm -rf dist-webpack

echo "Running Webpack..."
yarn run webpack

echo "Creating a minimal package.json..."
node create-package-json-for-bundle.js > dist-webpack/package.json

echo "Printing objects in dist folder..."
du -h dist-webpack/* --bytes
