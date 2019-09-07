import * as fs from 'fs-extra'
import * as path from 'path'
import * as Promise from 'bluebird'
import * as uuid from 'uuid/v4'

import chalk from 'chalk'

import { Bedr0ck } from './bedr0ck'

import { modules, IModulePromt } from './promts'
import { IManifest } from './manifest'
import { time } from './utils'

export class Create {
  private bedrock: Bedr0ck
  private src: string

  constructor(b: Bedr0ck) {
    this.bedrock = b
    this.src = b.dir.src
  }

  public prompt(type?: string, defaults: any = {}): Promise<void> {
    switch (type) {
      case 'module':
        return modules(this.bedrock, defaults).then((answers) => this.module(answers as IModulePromt)) as Promise<void>
      default:
        return Promise.reject(new Error(`Unknown creation type '${type}'`))
    }
  }

  public module(options: IModulePromt): Promise<void> {
    const manifest: IManifest = {
      format_version: 1,
      header: {
        name: options.name,
        description: options.description,
        uuid: uuid(),
        version: [1, 0, 0],
      },
      modules: [
        {
          description: `${ options.type === 'behavior' ? 'behaviors' : 'resources' } for ${options.namespace}`,
          type: options.type === 'behavior' ? 'client_data' : 'resources',
          uuid: uuid(),
          version:  [1, 0, 0],
        },
      ],
    }

    if (options.dependenies.length > 0) {
      manifest.dependencies = []

      for (const d of options.dependenies) {
        const dependency =  this.bedrock.modules.get(d)
        if (dependency) {
          manifest.dependencies.push({
            uuid: dependency.uuid,
            version: dependency.version,
          })
        }
      }
    }

    const dir = path.join(this.src, options.namespace)

    this.bedrock.emit('info', chalk`{green Creating {white '${options.name}'} in {white '${options.namespace}'}}`)

    const start: Date = new Date()
    return fs
      .ensureDir(dir)
      .then<void>(() => {
        const template = path.join(__dirname, '../resources/module', options.type, options.template )
        if (fs.existsSync(template)) {
          return fs.copy(template, dir)
        }
        return Promise.resolve()
      })
      .then<void>(() => fs.copy(path.join(__dirname, '../resources/pack_icon.png'), path.join(dir, 'pack_icon.png')))
      .then<void>(() => fs.writeJson(path.join(dir, 'manifest.json'), manifest, { spaces: '  ' }))
      .then<any>(() => this.bedrock.emit('info', chalk`{bgGreen {black  DONE }} {green Creation complete in ${time(start)}ms}`)) as Promise<void>
  }
}
