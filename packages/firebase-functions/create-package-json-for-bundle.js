const getVersion = () => require('./package.json').version

const getIncludedDependencies = () => {
  // Webpack defines some externals
  // To make the Firebase runtime fetch those, set them as dependencies in the generated package.json

  const webpackConfig = require('./webpack.config')
  const parentPackageJson = require('./package.json')

  const includedDependencies = webpackConfig.externals.map(external => {
    return [external, parentPackageJson.dependencies[external]]
  })

  // No Object.fromEntries in Node.js 10 yet
  const res = {}
  includedDependencies.forEach(entry => (res[entry[0]] = entry[1]))
  return res
}

const getEngines = () => require('./package.json').engines

const packageJson = {
  name: '@hoepel.app/firebase-functions-bundled',
  description: 'Serverless functions - bundled by webpack',
  version: getVersion(),
  main: 'bundle.js',
  license: 'GPL-3.0-or-later',
  private: true,
  dependencies: getIncludedDependencies(),
  engines: getEngines()
}

console.log(JSON.stringify(packageJson))
