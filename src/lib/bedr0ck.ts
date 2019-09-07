import * as Ajv from 'ajv'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import * as webpack from 'webpack'
import * as Promise from 'bluebird'
import * as archiver from 'archiver'

import { EventEmitter } from 'events'
import { ArchiverError, Archiver } from 'archiver'
import { Configuration, Stats } from 'webpack'

import { NoPackage, NoConfig, NoModules, InvalidManifest } from './errors'
import { shemea, IManifest } from './manifest'
import { getDirectories } from './utils'
import { Watch } from './watch'
import { Create } from './create'

import chalk from 'chalk'
import defaults from './webpack'

export interface IPacked {
  bytes: number,
  path: string,
  file: string,
}

export interface IModuleData {
  folder: string,
  path: string,
  name: string,
  uuid: string,
  version: [number, number, number],
  manifest: IManifest,
  webpack?: Configuration,
}

export interface IBedrockOptions {
  env?: string,
}

export interface IBedrockUserConfig {
  name?: string,
  version?: string,
  description?: string,
  rootDir?: string,
  srcDir?: string,
  distDir?: string,
  packDir?: string,
  nameing?: {
    mcaddon?: string,
    mcpack?: string,
    install?: string,
  }
  webpack?(conf: Configuration, opts: IBedrockOptions, mod: IModuleData, webpack: any): Configuration
}

export interface IBedrockConfig {
  name: string,
  version: string,
  description: string,
  rootDir: string,
  srcDir: string,
  distDir: string,
  packDir: string,
  nameing: {
    mcaddon: string,
    mcpack: string,
    install: string,
  }
  webpack?(conf: Configuration, opts: IBedrockOptions, mod: IModuleData, webpack: any): Configuration
}

const ajv = new Ajv()
const validate = ajv.compile(shemea)

export class Bedr0ck extends EventEmitter {
  public options: IBedrockOptions
  public config: IBedrockConfig
  public modules: Map<string, IModuleData> = new Map<string, IModuleData>()
  public dir: { pack: string, dist: string, src: string }

  constructor() {
    super()

    this.options = {
      env: process.env.NODE_ENV || 'production',
    }

    let conf: any = path.resolve(process.cwd(), 'bedrock.config.js')
    if (fs.existsSync(conf)) {
      const data = require(conf)
      conf = data ? data.default || data  : {}
    } else {
      this.emit('warn', new NoConfig('Unable to find bedrock user config', this))
      conf = {}
    }

    let pkg = {
      name: 'unnamed',
      version: '1.0.0',
      description: 'undescribed',
    }

    try {
      pkg = fs.readJSONSync(path.join(process.cwd(), 'package.json'))
    } catch (err) {
      this.emit('debug', new NoPackage('No package.json in cwd', this))
    }

    this.config = Object.assign({
      name: pkg.name,
      version:  pkg.version,
      description:  pkg.description,
      rootDir: process.cwd(),
      srcDir: 'src',
      distDir: 'dist',
      packDir: 'dist/packaged',
    }, conf)

    this.config.nameing = Object.assign({
      mcaddon:  '{project}-{projectVer}.mcaddon',
      mcpack:   '{module}-{moduleVer}.mcpack',
      install:  '{project}-{module}',
    }, conf.nameing || {})

    const { rootDir, srcDir, distDir, packDir } = this.config
    this.dir = {
      src:  path.join(rootDir, srcDir),
      dist: path.join(rootDir, distDir),
      pack: path.join(rootDir, packDir),
    }

    const modules = this.getModules(this.dir.src)
    if (!modules || modules.length <= 0) {
      throw new NoModules('No modules avalible', this)
    }

    this.emit('debug', `${modules.length} modules found, ${modules.map((m) => m.folder).join(',')}`)

    for (const mod of modules) {
      mod.webpack = this.config.webpack ?
        this.config.webpack(defaults(this.options, mod, this.config), this.options, mod, webpack) :
        defaults(this.options, mod, this.config)

      if (!mod.webpack.entry || Object.keys(mod.webpack.entry).length === 0) {
        delete mod.webpack
      }

      this.modules.set(mod.uuid, mod)
    }
  }

  public copy(mod: IModuleData): Promise<void> {
    this.emit('debug', `copy => ${mod.folder}`)
    return fs.copy(path.join(this.dir.src, mod.folder), path.join(this.dir.dist, mod.folder)) as Promise<void>
  }

  public clean(mod: IModuleData): Promise<void> {
    const dest = path.join(this.dir.dist, mod.folder)
    if (fs.existsSync(dest)) {
      this.emit('debug', `clean => ${mod.folder}`)
      return fs.remove(dest) as Promise<void>
    }
    return Promise.resolve()
  }

  public pack(module: IModuleData): Promise<IPacked>
  public pack(archive: string, filter: (archive: Archiver) => void): Promise<IPacked>
  public pack(file: string | IModuleData, filter?: (archive: Archiver) => void): Promise<IPacked> {
    if (typeof file !== 'string') {
      const mod = file as IModuleData
      filter = (zip) => zip.directory(path.join(this.dir.dist, mod.folder), mod.folder)
      file = path.join(this.dir.pack, this.naming(this.config.nameing.mcpack, mod))
    }

    return new Promise((resolve, reject) => {
      if (fs.existsSync(file as string)) {
        return fs.remove(file as string).then(resolve).catch(reject)
      }
      return resolve()
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        if (!filter) {
          return reject(new Error('No pack filter defined'))
        }

        const output = fs.createWriteStream(file as string)
        const zip = archiver('zip', {
          zlib: { level: 9 },
        })

        output.on('close', () => {
          this.emit('debug', `pack => ${file} size: ${zip.pointer()}`)
          return resolve({
            bytes: zip.pointer(),
            file: path.basename(file as string),
            path: path.dirname(file as string),
          })
        })

        zip.on('warning', (err: ArchiverError) => {
          if (err.code === 'ENOENT') {
            this.emit('warn', err)
          } else {
            return reject(err)
          }
        })

        zip.on('error', (err: Error) => {
          return reject(err)
        })

        filter(zip)

        zip.pipe(output)
        zip.finalize()
      })
    })
  }

  public package(mod?: IModuleData | IModuleData[]): Promise<IPacked> {
    const pack: Array<Promise<IPacked>> = []

    let modules
    if (mod) {
      if (Array.isArray(mod)) {
        modules = mod
      } else {
        modules = [mod]
      }
    } else {
      modules = Array.from(this.modules.values())
    }

    for (const m of modules) {
      pack.push(this.pack(m))
    }

    if (modules.length <= 0) {
      throw new NoModules('No modules avalible to package', this)
    }

    this.emit('debug', `package => ${modules.map((m) => m.folder).join(',')}`)
    return Promise
      .all(pack)
      .then<IPacked>((packed: IPacked[]) => {
        return this.pack(path.join(this.dir.pack, this.naming(this.config.nameing.mcaddon)), (zip) => {
          for (const data of packed) {
            zip.file(path.join(data.path, data.file), { name: data.file })
          }
        })
      })
  }

  public build(mod?: IModuleData | IModuleData[], install: boolean = false): Promise<IModuleData[]> {
    const modules: IModuleData[] = this.findModules(mod)

    const copies: Array<Promise<any>> = []
    const builds: IModuleData[] = []

    for (const m of modules) {
      m.webpack ? builds.push(m) : undefined
      copies.push(this.clean(m).then<void>(() => m.webpack ? Promise.resolve() : this.copy(m)))
    }

    this.emit('debug', `build => ${modules.map((m) => m.folder).join(',')}`)
    return Promise.all(copies)
      .then<any>(() => this.webpack(builds))
      .then<any>(() => install ? this.install(modules) : Promise.resolve())
      .then<any>(() => Promise.resolve(modules))
  }

  public webpack(mod?: IModuleData | IModuleData[]): Promise<IModuleData[]> {
    const modules: IModuleData[] = this.findModules(mod)

    const configs: Configuration[] = []
    const build: IModuleData[] = []

    for (const m of modules) {
      if (m.webpack) {
        configs.push(m.webpack)
        build.push(m)
      }
    }

    if (!configs || configs.length <= 0) {
      throw new NoModules('No modules avalible to webpack', this)
    }

    this.emit('debug', `webpack => ${build.map((m) => m.folder).join(',')}`)
    return new Promise<Stats>((resolve, reject) => {
      webpack(configs).run((error, stats) => {
        if (error || stats.hasErrors()) { return reject(error) }
        return resolve(stats)
      })
    })
    .then(() => Promise.resolve(build))
  }

  public install(mod?: IModuleData | IModuleData[]): Promise<IModuleData[]> {
    const modules: IModuleData[] = this.findModules(mod)

    const installs: Array<Promise<void>> = []
    const dir = this.getMinecraftPath()
    const installed = this.getInstalled()

    for (const m of modules) {
      const name = this.naming(this.config.nameing.install, m)

      let dest = ''
      switch (m.manifest.modules[0].type) {
        case 'resources':
          dest = path.join(dir, 'development_resource_packs')
          break
        case 'client_data':
        case 'data':
          dest = path.join(dir, 'development_behavior_packs')
          break
      }

      if (installed[m.uuid]) {
        installs.push(fs.remove(installed[m.uuid].path).then(() => fs.copy(m.path, path.join(dest, name))) as Promise<void>)
      } else {
        installs.push(fs.copy(m.path, path.join(dest, name)) as Promise<void>)
      }
    }

    this.emit('debug', `install => ${modules.map((m) => m.folder).join(',')}`)
    return Promise
      .all(installs)
      .then(() => Promise.resolve(modules))
  }

  public uninstall(mod?: IModuleData | IModuleData[]): Promise<IModuleData[]> {
    const modules: IModuleData[] = this.findModules(mod)

    const uninstalls: Array<Promise<void>> = []
    const uninstalled: IModuleData[]  = []
    const installed = this.getInstalled()

    for (const m of modules) {
      if (installed[m.uuid]) {
        uninstalls.push(fs.remove(installed[m.uuid].path) as Promise<void>)
        uninstalled.push(m)
      }
    }

    this.emit('debug', `uninstall => ${uninstalled.map((m) => m.folder).join(',')}`)
    return Promise
      .all(uninstalls)
      .then(() => Promise.resolve(uninstalled))
  }

  public watch(mod?: IModuleData | IModuleData[]) {
    return new Watch(this, this.findModules(mod)).start()
  }

  public create() {
    return new Create(this)
  }

  public naming(str: string, mod?: IModuleData): string {
    let data = str
      .replace(/{project}/g, this.config.name)
      .replace(/{projectVer}/g, this.config.version)
      .replace(/{projectDesc}/g, this.config.description)

    if (mod) {
      data = data
      .replace(/{module}/g, mod.folder)
      .replace(/{moduleVer}/g, mod.manifest.header.version.join('.'))
      .replace(/{moduleDesc}/g, mod.manifest.header.description)
    }

    this.emit('debug', `naming: '${str}' => '${data}'`)
    return data
  }

  public filter(str: string): IModuleData[] {
    const modules: IModuleData[] = []
    let folders: string[] = []
    if (str) {
      folders = str.trim().toLowerCase().split(',')
    }

    for (const [k, m] of this.modules) {
      if ((folders.length > 0) && (!folders.includes(m.folder.toLowerCase()))) {
        continue
      }
      modules.push(m)
    }

    this.emit('debug', `filter: ${str} => ${modules.map((m) => m.folder).join(',')}`)
    return modules
  }

  public manifest(file: string): IManifest {
    let json
    try {
      json = fs.readJSONSync(file)
      if (!validate(json)) {
        throw new InvalidManifest(`Invalid ${file}, skipping...`, this, validate.errors)
      }
    } catch (err) {
      throw new InvalidManifest(`Malformed json for ${file}, skipping...`, this, err)
    }

    this.emit('debug', `manifest => ${file}`)
    return json
  }

  public getMinecraftPath(): string {
    let minepath
    switch (os.platform()) {
      case 'win32':
        minepath = path.join(process.env['LOCALAPPDATA'] as string, 'Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState')
        break
      case 'linux':
        minepath = path.join(os.homedir(), '.local/share/mcpelauncher')
        break
      case 'darwin':
        minepath = path.join(os.homedir(), 'Library/Application Support/mcpelauncher')
        break
      case 'android':
        minepath = path.join(os.homedir(), 'storage/shared/')
        break
      default:
        throw new Error('Unknown platform, please set the BEDROCK_DATA_DIR environment variable')
    }

    const dir = path.join(minepath, 'games/com.mojang')

    try {
      fs.statSync(dir)
    } catch (err) {
      throw new Error(`Minecraft Bedrock edition's data directory is not available: ${dir}`)
    }

    return dir
  }

  public getInstalled(): { [key: string]: IModuleData } {
    const installed: { [key: string]: IModuleData } = {}

    const dir = process.env['BEDROCK_DATA_DIR'] || this.getMinecraftPath()
    const resource = this.getModules(path.join(dir, 'development_resource_packs'))
    for (const res of resource) {
      installed[res.uuid] = res
    }

    const behavior = this.getModules(path.join(dir, 'development_behavior_packs'))
    for (const bev of behavior) {
      installed[bev.uuid] = bev
    }

    return installed
  }

  public getModules(dir: string): IModuleData[] {
    const data = getDirectories(dir)
    const modules: IModuleData[]  = []

    if (!data || data.length <= 0) {
      return []
    }

    for (const mod of data) {
      const folder = mod.split(path.sep).pop() as string

      const manifest = path.join(mod, 'manifest.json')
      if (!fs.existsSync(manifest)) { continue }

      let json: IManifest
      try {
        json = this.manifest(manifest)
      } catch (err) {
        this.emit('warn', err)
        continue
      }

      modules.push({
        folder,
        path: mod,
        name: json.header.name,
        version: json.header.version,
        uuid: json.header.uuid,
        manifest: json,
      })
    }

    return modules
  }

  private findModules(mod?: IModuleData | IModuleData[]): IModuleData[] {
    if (mod) {
      if (Array.isArray(mod)) {
        return mod
      } else {
        return [mod]
      }
    } else {
      return this.getModules(this.dir.dist)
    }
  }
}
