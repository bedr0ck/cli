import * as fs from 'fs-extra'
import * as path from 'path'

export const isDirectory = (source: string): boolean => fs.lstatSync(source).isDirectory()
export const getDirectories = (source: string): string[] => fs.existsSync(source) ? fs.readdirSync(source).map((name: string) => path.join(source, name)).filter(isDirectory) : []
export const time = (start: Date): string => (new Date().getTime() - start.getTime()).toString()
