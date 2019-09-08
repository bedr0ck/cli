import * as fs from 'fs-extra'
import * as path from 'path'
import * as Promise from 'bluebird'
import * as chokidar from 'chokidar'
import * as globby from 'globby'

import { Bedr0ck, IModuleData } from './bedr0ck'

export class Watch {
  private bedrock: Bedr0ck
  private modules: Map<string, IModuleData> = new Map<string, IModuleData>()
  private installed: { [key: string]: IModuleData } = {}
  private files: string[] = []
  private dir: { dist: string, src: string }

  constructor(b: Bedr0ck, modules: IModuleData[]) {
    this.bedrock = b

    if (modules) {
      for (const m of modules) {
        this.modules.set(m.folder, m)
      }
    }

    this.dir = {
      dist: b.dir.dist,
      src: b.dir.src,
    }
  }

  public start(): Promise<void> {
    if (this.modules.size <= 0) {
      throw new Error('No modules to wach')
    }

    const globs: string[] = []
    for (const [k, m] of this.modules) {
      globs.push(path.join(this.dir.src, m.folder, '**/*').replace(/\\/g, '/'))
    }

    this.bedrock.emit('info', 'Starting build process...')

    return this.bedrock
      .build(Array.from(this.modules.values()), true)
      .then<string[]>(() => globby(globs))
      .then<void>((glob: string[]) => {
        this.installed = this.bedrock.getInstalled()

        for (const g of glob) {
          this.files.push(g.replace(/\//g, path.sep))
        }

        const watching = []
        for (const [k, m] of this.modules) {
          watching.push(path.join(this.dir.src, k))
        }
        const watcher = chokidar.watch(watching)

        this.bedrock.emit('info', 'Build complete, waiting for changes...')
        this.bedrock.emit('debug', `Watching: ${watching.map((p) => path.basename(p)).join(',')}`)

        watcher
          .on('change', (file) => {
            this.bedrock.emit('info', 'Changes detected, rebuilding...')
            this
              .update(file, 'change')
              .then(() => { this.bedrock.emit('info', 'Rebuild Complete') })
          })
          .on('add', (file) => {
            const index = this.files.indexOf(file)
            if (index > -1) { return } else { this.files.push(file) }

            this.bedrock.emit('info', 'Changes detected, rebuilding...')
            this
              .update(file, 'add')
              .then(() => { this.bedrock.emit('info', 'Rebuild Complete') })
          })
          .on('unlink', (file) => {
            const index = this.files.indexOf(file)
            if (index > -1) { this.files.splice(index, 1) }

            this.bedrock.emit('info', 'Changes detected, rebuilding...')
            this
              .update(file, 'unlink')
              .then(() => { this.bedrock.emit('info', 'Rebuild Complete') })
          })

        return Promise.resolve()
      })
  }

  private update(file: string, action: string): Promise<boolean> {
    const base = file.replace(`${this.dir.src}${path.sep}`, '')
    const folders = base.split(path.sep)

    if (!this.modules.has(folders[0])) {
      this.bedrock.emit('debug', `Not a module '${folders[0]}', skipping...`)
      return Promise.resolve(false)
    }

    const mod = this.modules.get(folders[0]) as IModuleData
    const dest = path.join(this.dir.dist, mod.folder)
    const installed = this.installed[mod.uuid]

    if (!installed) {
      this.bedrock.emit('debug', `Not installed '${folders[0]}', skipping...`)
      return Promise.resolve(false)
    }

    if (folders[1] === 'scripts') {
      this.bedrock.emit('debug', `Scripts changed, rebuilding ${folders[0]}`)
      return fs
        .remove(path.join(dest, 'scripts'))
        .then<IModuleData[]>(() => this.bedrock.webpack(mod))
        .then<void>(() => fs.remove(path.join(installed.path, 'scripts')))
        .then<void>(() => fs.ensureDir(path.join(installed.path, 'scripts')))
        .then<void>(() => fs.copy(path.join(dest, 'scripts'), path.join(installed.path, 'scripts')))
        .then<boolean>(() => {
          this.bedrock.emit('debug', 'Build complete')
          return Promise.resolve(true)
        }) as Promise<boolean>
    }

    const f = file.replace(`${path.join(this.dir.src, mod.folder)}${path.sep}`, '')
    switch (action) {
      case 'add':
        this.bedrock.emit('debug', `File added ${file}`)
        return fs
          .copy(file, path.join(base, f))
          .then<void>(() => fs.copy(file, path.join(installed.path, f)))
          .then<boolean>(() => {
            this.bedrock.emit('debug', 'Copy complete')
            return Promise.resolve(true)
          }) as Promise<boolean>

      case 'unlink':
        this.bedrock.emit('debug', `File removed ${file}`)
        return fs
          .remove(path.join(dest, f))
          .then<void>(() => fs.remove(path.join(installed.path, f)) )
          .then<boolean>(() => {
            this.bedrock.emit('debug', 'Unlink complete')
            return Promise.resolve(true)
          }) as Promise<boolean>

      case 'change':
        this.bedrock.emit('debug', `File changed ${file}`)
        if (path.basename(file) === 'manifest.json') {
          try {
            this.bedrock.manifest(file)
          } catch (err) {
            this.bedrock.emit('error', err)
            return Promise.resolve(false)
          }
        }
        return fs
          .remove(path.join(dest, f))
          .then<void>(() => fs.copy(file, path.join(dest, f)))
          .then<void>(() => fs.remove(path.join(installed.path, f)) )
          .then<void>(() => fs.copy(file, path.join(installed.path, f)))
          .then<boolean>(() => {
            this.bedrock.emit('debug', 'Copy complete')
            return Promise.resolve(true)
          }) as Promise<boolean>
    }

    return Promise.resolve(false)
  }
}
