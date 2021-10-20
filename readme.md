# webpack-config

![NPM Package Version](https://img.shields.io/npm/v/@fastcms/webpack-config) ![Peer Webpack Version](https://img.shields.io/npm/dependency-version/@fastcms/webpack-config/peer/webpack) ![Node.js Version](https://img.shields.io/node/v/@fastcms/webpack-config) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) ![NPM Weekly Downloads](https://img.shields.io/npm/dw/@fastcms/webpack-config) ![GitHub CI Workflow](https://github.com/fastcms/webpack-config/actions/workflows/main.yml/badge.svg)

> Shared @webpack config for web development projects of @fastcms.

## Installation

Use npx to install peerdeps automatically or install peerDependencies and optionalDependencies with npm/yarn manually.

```bash
# Install using npm
$ npm info "@fastcms/webpack-config" peerDependencies optionalDependencies
$ npx install-peerdeps --dev @fastcms/webpack-config

# Install using yarn (using babel-loader)
$ yarn add --dev @fastcms/webpack-config
$ yarn add --dev @babel/core webpack

# Optional dependencies (using esbuild-loader)
$ yarn add --dev esbuild

# Optional dependencies (using swc-loader)
$ yarn add --dev @swc/core
```

## Usage

After installation, add following contents to your `webpack.config.js` file.

```js
const path = require('path');
const webpackConfig = require('@fastcms/webpack-config');

const NAME = 'fastcms';
const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

const ENTRY = {
  [NAME]: './src/index.js',
  [`${NAME}WebWorker`]: './src/index.worker.js',
};

const EXTERNALS = {
  'react': 'React',
  'react-dom': 'ReactDOM',
};

module.exports = (env, argv) =>
  webpackConfig(env, argv, {
    NAME,
    ENTRY,
    LIBRARY_TARGET: env.target || 'umd',
    EXTERNALS,
    SRC_DIR,
    DIST_DIR,

    // USE_SWC: true,
    // USE_ESBUILD: true,
  });
```

The webpack config example above is used for bundling web project, the default loader for JavsScript and TypeScript is `babel-loader`. If you set `USE_SWC` to `true`, the loader will be `swc-loader`, If you set `USE_ESBUILD` to `true`, the loader will be `esbuild-loader`.

If you don't want to bundle some external dependencies to the output file, you should add these dependencies to `EXTERNALS`.

## License

The codebase and documentation in this repository are released under the [MIT License](./license)
