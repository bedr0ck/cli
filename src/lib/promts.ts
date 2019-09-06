import * as path from 'path'

import { Bedr0ck } from './bedr0ck'
import { getDirectories } from './utils'

import * as inquirer from 'inquirer'
import { Answers } from 'inquirer'

export interface IModulePromt {
  namespace: string,
  name: string,
  description: string,
  type: 'resource' | 'behavior',
  dependenies: string[],
  template: 'boilerplate' | 'blank',
}

export function modules(b: Bedr0ck, defaults: any = {}): Promise<Answers> {
  const dependenies: Array<{ name: string, value: string, short: string }> = []

  for (const [k, m] of b.modules) {
    dependenies.push({
      name: m.name,
      value: m.uuid,
      short: m.folder,
    })
  }

  return inquirer
    .prompt([{
        type: 'input',
        name: 'namespace',
        message: 'Module namespace?',
        default: defaults.namespace,
      }, {
        type: 'input',
        name: 'name',
        message: 'Module name?',
        default: defaults.name,
      }, {
        type: 'input',
        name: 'description',
        message: 'Module description?',
        default: defaults.description,
      }, {
        type: 'list',
        name: 'type',
        message: 'Type of module?',
        choices: [{
          name: 'Behavior',
          value: 'behavior',
          short: 'behavior',
        }, {
          name: 'Resource',
          value: 'resource',
          short: 'resource',
        }],
      }, {
        type: 'checkbox',
        name: 'dependenies',
        message: 'Module Dependenies?',
        choices: dependenies,
      }])
    .then((answers) => {
      const templates = ['blank']
      for (const d of getDirectories(path.join(__dirname, '../resources/module', answers.type )) ) {
        templates.push(path.basename(d))
      }

      return inquirer
        .prompt([{
          type: 'list',
          name: 'template',
          message: 'Module template?',
          choices: templates,
          default: 'blank',
        }])
        .then((final) => Object.assign({}, answers, final))
    })
}
