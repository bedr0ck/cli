import * as fs from 'fs'
import * as path from 'path'

// @ts-ignore
import * as CopyPlugin from 'copy-webpack-plugin'
// @ts-ignore
import * as FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin'

import { Configuration } from 'webpack'
import { IBedrockConfig, IBedrockOptions, IModuleData } from './bedr0ck'

export const addEntry = (base: Configuration, file: string, scope: string) => {
  if (fs.existsSync(file)) {
    // @ts-ignore
    typeof base.entry === 'object' ? base.entry[scope] = [file] : base.entry = { [scope]: [file] }
  }
}

export default function(opts: IBedrockOptions, mod: IModuleData, conf: IBedrockConfig): Configuration {

  const base: Configuration = {
    name: mod.folder,

    // Webpack v4 add a mode configuration option tells webpack to use its
    // built-in optimizations accordingly.
    // @see https://webpack.js.org/concepts/mode/
    mode: opts.env === 'development' ? 'development' : 'production',

    // Webpack can target multiple environments such as `node`,
    // `browser`, and even `electron`. Since bedrocks is focused on minecraft/web,
    // we set the default target accordingly.
    target: 'web',

    // As of Webpack 2 beta, Webpack provides performance hints.
    // Since we are not targeting a browser, bundle size is not relevant.
    // Additionally, the performance hints clutter up our nice error messages.
    performance: {
      hints: false,
    },

    // Since we are wrapping our own webpack config, we need to properly resolve
    // Bedrocks's and the given user's node_modules without conflict.
    resolve: {
      extensions: ['.js'],
    },

    // This sets the default output file path, name, and compile target
    // module type.
    output: {
      // Hacky way to force webpack to have multiple output folders vs multiple files per one path
      filename: 'scripts/[name]/[name].js',
      libraryTarget: 'commonjs',
      path: path.join(conf.rootDir, conf.outDir, mod.folder),
    },

    plugins: [
      // The FriendlyErrorsWebpackPlugin (when combined with source-maps)
      // gives Backpack its human-readable error messages.
      new FriendlyErrorsWebpackPlugin({
        clearConsole: opts.env === 'development',
      }),

      // Copy all the other files for the mod
      new CopyPlugin([
        {
          context: path.join(conf.rootDir, conf.srcDir, mod.folder, '**/*').replace(/\\/g, '/'),
          from: `**/*`,
          ignore: ['scripts/**/*'],
        },
      ]),
    ],
  }

  addEntry(base, path.join(conf.rootDir, conf.srcDir, mod.folder, 'scripts/client/index.js'), 'client')
  addEntry(base, path.join(conf.rootDir, conf.srcDir, mod.folder, 'scripts/client/client.js'), 'client')

  addEntry(base, path.join(conf.rootDir, conf.srcDir, mod.folder, 'scripts/server/index.js'), 'server')
  addEntry(base, path.join(conf.rootDir, conf.srcDir, mod.folder, 'scripts/server/server.js'), 'server')

  return base
}
