#!/usr/bin/env node

import * as Promise from 'bluebird'
import chalk from 'chalk'
import cac from 'cac'

import Bedr0ck from '../lib'
import { time } from '../lib/utils'

// @ts-ignore
import { version } from '../package.json'

const bedrock = new Bedr0ck()
const cli = cac('bedr0ck')

cli
  .option('--verboose, --debug', '')

cli
  .command('build [module]', 'Builds addon scripts into one file')
  .option('-w, --watch', 'Watch for changes, build and install modules')
  .option('-i, --install', 'Install module after build')
  .action((mod: string, opts) => {
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return new Promise((resolve, reject) => {
      if (opts.w) {
         return bedrock.watch(modules).then(resolve).catch(reject)
      }
      return bedrock.build(modules, opts.i).then(resolve).catch(reject)
    })
    .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Building complete in ${time(start)}ms}`))
    .catch((err) => console.error(err))
  })

cli
  .command('pack [module]', 'Packs addons into one .mcaddon package')
  .option('-b, --build', 'build before packing')
  .action((mod, opts) => {
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return new Promise((resolve, reject) => {
      if (opts.b) { return bedrock.build(modules).then(resolve).catch(reject) }
      return resolve()
    })
    .then<any>(() => bedrock.package(modules))
    .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Packing complete in ${time(start)}ms}`))
    .catch((err) => console.error(err))
  })

cli
  .command('install [module]', 'Installs module from your local micraft client')
  .option('-b, --build', 'build before installing')
  .action((mod, opts) => {
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return bedrock
      .install(modules)
      .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Install complete in ${time(start)}ms}`))
      .catch((err) => console.error(err))
  })

cli
  .command('uninstall [module]', 'Uninstalls module from your local micraft client')
  .action((mod, opts) => {
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return bedrock
      .uninstall(modules)
      .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Uninstall complete in ${time(start)}ms}`))
      .catch((err) => console.error(err))
  })

cli
  .command('init [name]', 'Initializes a new object')
  .action((namespace, options) => {
    return bedrock
      .create()
      .prompt('module', { namespace })
      .catch((err) => console.error(err))
  })

cli.help()
cli.version(version)
cli.parse()

if (cli.options.debug) {
  bedrock.on('debug', (m) => console.log(m))
}

bedrock.on('error', (m) => console.log(m))
bedrock.on('warn', (m) => console.log(m))
bedrock.on('info', (m) => console.log(m))
bedrock.on('message', (m) => console.log(m))

process.on('SIGINT', () => {
  console.log(`goodbye`)
  process.exit()
})
