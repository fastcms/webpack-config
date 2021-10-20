const path = require('path');
const webpack = require('webpack');
const DotEnv = require('dotenv-webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (
  env,
  argv,
  {
    NAME = 'index',
    MAIN = 'index.js',
    ENTRY,
    PUBLIC_PATH = process.env.PUBLIC_URL || 'auto',

    TARGET = 'browserslist',
    LIBRARY_TARGET = 'umd',

    EXTERNALS = {},

    USE_ESBUILD = false,
    ESBUILD_TARGET = 'es2017',

    USE_SWC = false,
    SWR_LOADER_OPTIONS = {},

    SRC_DIR,
    DIST_DIR,
    EXCLUDE_DIR = /(node_modules|codecs)/,
    CODECS_DIR,

    DEVTOOL,
    BYTE_LIMIT = 2048,

    CSS_MODULES = false,
    CSS_MINIFIER = 'cssnano',
    CSS_MINIFIER_OPTIONS = {},

    INLINE_WASM = false,
    INLINE_WORKER = false,

    DOT_ENV_PATH = './.env',
    DOT_ENV_SAFE = false,
  },
) => {
  const { mode = 'development' } = argv;
  const isProd = mode === 'production';
  const outputModule = LIBRARY_TARGET === 'module';

  let cssMinimizer;

  switch (CSS_MINIFIER) {
    case 'csso': {
      cssMinimizer = CssMinimizerPlugin.cssoMinify;
      break;
    }

    case 'clean-css': {
      cssMinimizer = CssMinimizerPlugin.cleanCssMinify;
      break;
    }

    default:
      break;
  }

  const minimizer = [
    new CssMinimizerPlugin({
      minify: cssMinimizer,
      minimizerOptions: CSS_MINIFIER_OPTIONS,
    }),
  ];

  let rules = [
    {
      test: /\.worker\.m?js$/,
      exclude: EXCLUDE_DIR,
      use: [
        {
          loader: 'worker-loader',
          options: {
            esModule: true,
            inline: INLINE_WORKER ? 'fallback' : 'no-fallback',
            filename: outputModule ? '[name].mjs' : '[name].js',
          },
        },
      ],
    },
    {
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: true,
          },
        },
        {
          loader: 'css-loader',
          options: {
            esModule: true,
            modules: CSS_MODULES
              ? {
                  localIdentName: isProd ? '[hash:base64:8]' : '[path][name]__[local]',
                }
              : false,
          },
        },
      ],
    },
    {
      test: /\.(woff2?|svg|png|jpe?g|gif|bmp|heic|tiff|webp|avif|pdf|mp3|mp4|dcm)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: BYTE_LIMIT,
          },
        },
      ],
    },
    {
      test: /\.wasm$/,
      type: INLINE_WASM ? 'asset/inline' : 'asset/resource',
    },
  ];

  if (USE_ESBUILD) {
    minimizer.push(
      new ESBuildMinifyPlugin({
        target: ESBUILD_TARGET,
        exclude: EXCLUDE_DIR,
      }),
    );

    rules[0].use.push({
      loader: 'esbuild-loader',
      options: {
        loader: 'js',
        target: ESBUILD_TARGET,
      },
    });

    rules = [
      {
        test: /\.json$/,
        loader: 'esbuild-loader',
        exclude: EXCLUDE_DIR,
        options: {
          loader: 'json',
          target: ESBUILD_TARGET,
        },
      },
      {
        test: /\.m?js$/,
        loader: 'esbuild-loader',
        exclude: EXCLUDE_DIR,
        options: {
          loader: 'js',
          target: ESBUILD_TARGET,
        },
      },
      {
        test: /\.jsx$/,
        loader: 'esbuild-loader',
        exclude: EXCLUDE_DIR,
        options: {
          loader: 'jsx',
          target: ESBUILD_TARGET,
        },
      },
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        exclude: EXCLUDE_DIR,
        options: {
          loader: 'ts',
          target: ESBUILD_TARGET,
        },
      },
      {
        test: /\.tsx$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: ESBUILD_TARGET,
        },
      },
      ...rules,
    ];
  } else if (USE_SWC) {
    rules[0].use.push({
      loader: 'swc-loader',
      options: SWR_LOADER_OPTIONS,
    });

    rules = [
      {
        test: /\.m?js$/,
        exclude: EXCLUDE_DIR,
        use: {
          loader: 'swc-loader',
          options: SWR_LOADER_OPTIONS,
        },
      },
      {
        test: /\.tsx?$/,
        exclude: EXCLUDE_DIR,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
            },
            ...SWR_LOADER_OPTIONS,
          },
        },
      },
      ...rules,
    ];
  } else {
    minimizer.push(
      new TerserPlugin({
        parallel: true,
        extractComments: false,
      }),
    );

    rules[0].use.push({
      loader: 'babel-loader',
      options: {
        envName: mode,
        cacheCompression: !isProd,
        cacheDirectory: !isProd,
      },
    });

    rules.push({
      test: /\.(mjs|jsx?|tsx?)$/,
      loader: 'babel-loader',
      exclude: EXCLUDE_DIR,
      options: {
        envName: mode,
        cacheCompression: !isProd,
        cacheDirectory: !isProd,
      },
    });
  }

  if (CODECS_DIR) {
    rules = [
      ...rules,
      {
        loader: 'exports-loader',
        test: path.join(CODECS_DIR, 'jpeg.js'),
        options: {
          type: 'commonjs',
          exports: 'JpegImage',
        },
      },
    ];
  }

  /**
   * @type {import("webpack").Configuration}
   */
  const webpackConfig = {
    mode,
    target: TARGET,
    cache: !isProd,
    context: SRC_DIR,
    devtool: DEVTOOL ?? isProd ? 'source-map' : 'eval-cheap-module-source-map',
    externals: EXTERNALS,

    entry: ENTRY || {
      [NAME]: path.join(SRC_DIR, MAIN),
    },

    output: {
      path: DIST_DIR,
      library: outputModule ? undefined : '[name]',
      libraryTarget: LIBRARY_TARGET,
      module: outputModule,
      iife: LIBRARY_TARGET === 'umd',
      umdNamedDefine: LIBRARY_TARGET === 'umd',
      globalObject: LIBRARY_TARGET === 'umd' ? 'this' : undefined,
      filename: outputModule ? '[name].mjs' : '[name].js',
      scriptType: outputModule ? 'module' : false,
      publicPath: isProd ? PUBLIC_PATH : 'auto',
      pathinfo: !isProd,
    },

    optimization: {
      minimize: isProd,
      minimizer,
    },

    resolve: {
      alias: {},
      mainFields: ['module', 'main'],
      extensions: ['.json', '.js', '.mjs', '.ts', '.jsx', '.tsx', '.wasm'],
      fallback: {
        fs: false,
        path: false,
      },
      modules: [
        SRC_DIR,
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '..', 'node_modules'),
        path.resolve(__dirname, '..', '..', 'node_modules'),
      ],
    },

    module: {
      noParse: /codecs/,
      rules,
    },

    plugins: [
      new webpack.ProgressPlugin(),
      new webpack.EnvironmentPlugin({
        __DEV__: !isProd,
      }),
      new DotEnv({
        path: DOT_ENV_PATH,
        safe: DOT_ENV_SAFE,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    ],

    experiments: {
      asyncWebAssembly: true,
      outputModule,
      topLevelAwait: true,
    },
  };

  return webpackConfig;
};
