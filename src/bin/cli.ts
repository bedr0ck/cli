#!/usr/bin/env node

import * as Promise from 'bluebird'
import chalk from 'chalk'
import cac from 'cac'

import Bedr0ck, { IPacked, IModuleData } from '../lib'
import { time } from '../lib/utils'

// @ts-ignore
import { version } from '../package.json'

const cli = cac('bedr0ck')

const init = (): Bedr0ck => {
  const bedrock = new Bedr0ck()

  if (cli.options.debug) {
    bedrock.on('debug', (m) => console.log(m))
  }

  bedrock.on('error', (m) => console.log(m))
  bedrock.on('warn', (m) => console.log(m))
  bedrock.on('info', (m) => console.log(m))
  bedrock.on('message', (m) => console.log(m))

  return bedrock
}

cli
  .option('--verboose, --debug', 'Verboose output')

cli
  .command('build [module/s?]', 'Builds addon scripts into one file')
  .option('-w, --watch', 'Watch for changes, build and install modules')
  .option('-i, --install', 'Install module after build')
  .action((mod: string, opts): Promise<void> => {
    const bedrock = init()

    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return new Promise((resolve, reject): Promise<IModuleData[] | void> => {
      if (opts.w) {
        return bedrock.watch(modules).then(resolve).catch(reject)
      }
      return bedrock.build(modules, opts.i).then(resolve).catch(reject)
    })
    .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Building complete in ${time(start)}ms}`))
    .catch((err) => console.error(err))
  })

cli
  .command('pack [module/s?]', 'Packs addons into one .mcaddon package')
  .option('-b, --build', 'Build before packing')
  .action((mod, opts): Promise<void> => {
    const bedrock = init()
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return new Promise((resolve, reject): void => {
      if (opts.b) {
        bedrock.build(modules).then(resolve).catch(reject)
        return
      }
      return resolve()
    })
    .then<IPacked>(() => bedrock.package(modules))
    .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Packing complete in ${time(start)}ms}`))
    .catch((err) => console.error(err))
  })

cli
  .command('install [module/s?]', 'Installs module from your local micraft client')
  .option('-b, --build', 'Build before installing')
  .action((mod, opts): Promise<void> => {
    const bedrock = init()
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return bedrock
      .install(modules)
      .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Install complete in ${time(start)}ms}`))
      .catch((err) => console.error(err))
  })

cli
  .command('uninstall [module/s?]', 'Uninstalls module from your local micraft client')
  .action((mod, opts): Promise<void> => {
    const bedrock = init()
    const modules = bedrock.filter(mod)
    const start: Date = new Date()

    return bedrock
      .uninstall(modules)
      .then<void>(() => console.log(chalk`{bgGreen {black  DONE }} {green Uninstall complete in ${time(start)}ms}`))
      .catch((err) => console.error(err))
  })

cli
  .command('init [name?]', 'Initializes a new module')
  .action((namespace, opts): Promise<void> => {
    const bedrock = init()
    return bedrock
      .create()
      .prompt('module', { namespace })
      .catch((err) => console.error(err))
  })

cli.help()
cli.version(version)
cli.parse()

process.on('SIGINT', (): void => {
  console.log('goodbye')
  process.exit()
})
