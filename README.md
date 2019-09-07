<div align="center">
<img src="https://github.com/bedr0ck/graphics/raw/master/full-logo-b.png" width="650" height="auto"/>
</div>

<div align="center">

[![Known Vulnerabilities](https://snyk.io/test/github/bedr0ck/cli/badge.svg)](https://snyk.io/test/github/bedr0ck/cli) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

</div>

<div align="center">

[![NPM version](https://img.shields.io/npm/v/@bedr0ck/cli.svg?style=flat)](https://www.npmjs.com/package/@bedr0ck/cli)
[![NPM downloads](https://img.shields.io/npm/dm/@bedr0ck/cli.svg?style=flat)](https://www.npmjs.com/package/@bedr0ck/cli)
[![Security Responsible
Disclosure](https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg)](https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md)

</div>

<div align="center">

# THIS IS A WIP

</div>

# @bedr0ck/cli

Helps with some common tasks when building a minecraft mod for Bedrock edition:

-   builds `.mcpack` and `.mcaddon` packages
-   installs the mod into Minecraft for Windows 10's development folders
-   watches for file changes and reinstalls as necessary

## Prerequisites

| Software  | Minimum                                                 | Recommended                                               |
| --------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Minecraft | Minecraft Bedrock Edition Beta                          | Minecraft Bedrock Edition Beta on your Windows 10 device  |
| Storage   | 1.0 GB of free space for text editor, game, and scripts | 3.0 GB of free space for Visual Studio, game, and scripts |
| Node.js   | 8.x                                                     | 10.x                                                      |

Scripting in Minecraft is currently only officially supported on Windows 10 Bedrock Edition Beta, however there have been reports that users have been able to use alternative launchers to get scripting working on other platforms, and although the toolchain attempts to support Linux, Mac OS and Android, they are currently untested and support for these platforms is limited.

### Getting the Bedrock Edition Beta

Mojang provides instructions on how to get into the Beta program here: [How to get into Minecraft betas](https://minecraft.net/en-us/article/how-get-minecraft-betas)

## Getting Started

Ensure you have a package.json file present in your development directory, if you do not, you can create a minimal valid package with the following contents:

```json
{
	"private": true
}
```

or you can run `npm init` in the direcotry of your project

install the bedr0ck cli package

```
npm install --save-dev @bedr0ck/cli
```

This will automatically install the required packages

## Create a bedrock configuration file

use the following as a template for your bedrock.config.js

```javascript
// bedrock.config.js
// IMPORTANT: This file is not going through babel transformation.
// You can however use the ES2015 features supported by your Node.js version.
module.exports = {
  /**
   * Name of addon
   * @optional
   * @default package.json > name
   */
  // name: 'name',

  /**
   * Version of addon
   * @optional
   * @default package.json > version
   */
  // version: 'version',

  /**
   * Description of addon
   * @optional
   * @default package.json > description
   */
  // description: 'description',

  /**
   * Base directory for source, distributable and packaged files
   * @optional
   * @default process.cwd()
   */
  // rootDir: process.cwd(),

  /**
   * Directory for source files,
   * @optional
   * @default src
   */
  // srcDir: 'src',

  /**
   * Directory for distributable files
   * @optional
   * @default dist
   */
  // distDir: 'dist',

  /**
   * Directory for distributable files
   * @optional
   * @default dist/pack
   */
  // packDir: 'dist/pack',

  /**
   * This is where you can change the name of the distributable files
   * @optional
   * @mcaddon The file name of the generated mcaddon
   * @mcpack  The file name of the generated mcpack
   * @install The folder name of the module when installing
   */
  // nameing: {
  //   mcaddon: '{project}-{projectVer}.mcaddon',
  //   mcpack: '{module}-{moduleVer}.mcpack',
  //   install: '{project}-{module}',
  // },

  /**
   * Version of addon
   * @optional
   * @param config webpack config
   * @param options bedrocks env options (see https://github.com/bedr0ck/cli/blob/master/src/lib/bedr0ck.ts#L38)
   * @param mod info about module that is bing packed (see https://github.com/bedr0ck/cli/blob/master/src/lib/bedr0ck.ts#L28)
   * @param webpack the webpack imported npm module (see https://webpack.js.org/)
   * @returns webpack config
   */
	webpack(config, options, mod, webpack) {
    // Perform customizations to config
    // Important: return the modified config

    // By default it will detect index.js in scripts/client/ and scripts/server/
    // if you want to add a new entry point use:
    /*
    let entry
    switch (mod.folder) {
      case 'my-module':
        entry = {
          // 'path of dist file w/o ext' : 'path of src file with ext'
          'scripts/client/entry' :    'scripts/client/entry.js',
          'scripts/client/new-entry' : 'scripts/client/new-entry.js',
          'scripts/server/entry' :    'scripts/server/entry.js',
          'scripts/server/new-entry' : 'scripts/server/new-entry.js',
        }
        break
    }

    if (entry) {
      for (const k of Object.keys(entry)) {
        let file = path.join(conf.rootDir, conf.srcDir, mod.folder, entry[k])
        typeof config.entry === 'object' ? config.entry[k] = [file] : config.entry = { [k]: [file] }
      }
    }
    */

    return config
  }
}
```

Next, update your package.json with appropriate scripts, here are some useful scripts

```json
  "scripts": {
    "init": "bedr0ck init",
    "build": "bedr0ck build",
    "build:watch": "bedr0ck build -w",
    "build:install": "bedr0ck build -i",
    "pack": "bedr0ck pack",
    "pack:build": "bedr0ck pack -b",
    "install": "bedr0ck install",
    "uninstall": "bedr0ck uninstall",
  },
```

-   use **npm run init** to create a new boilerplate module
-   use **npm run build** to create the directory structure for a .mcaddon
-   use **npm run install** to install the addon into Minecraft for Windows 10
-   use **npm run uninstall** to uninstall the addon into Minecraft for Windows 10
-   use **npm run watch** to:
    -   build the project
    -   deploy it to to Minecraft for Windows 10
    -   monitor for changes on the filesystem
        -   automatically rebuilds and deploys the project.

## Conventions

These scripts will assume a certain directory structure by default. These can be overridden by altering properties on the `srcDir`, `distDir` and `packDir` objects in your bedrock.config.js.

| directory       | purpose                                                                                                                | config property |
| --------------  | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| .\src           | place a directory in here for each pack you have. The type of the pack will be determined by it's `manifest.json` file | srcDir          |
| .\dist          | the constructed pack directories will be assembled here, ready for deployment into Minecraft                           | distDir         |
| .\dist\packaged | constructed .mcpack and .mcaddon files will be placed here                                                             | packDir         |

## Commands

```
Usage:
  $ bedr0ck <command> [options]
  $ bedrock <command> [options]

Options:
  -w, --watch          Watch for changes, build and install modules
  -b, --build          Build before installing/packing
  -i, --install        Install module after build
  -h, --help           Display help
  -v, --version        Display version number
  --verboose, --debug  Verboose output

Commands:
  build [module/s?]      Builds addon scripts into one file
  pack [module/s?]       Packs addons into one .mcaddon package
  install [module/s?]    Installs module from your local micraft client
  uninstall [module/s?]  Uninstalls module from your local micraft client
  init [name?]           Initializes a new module

[module/s?]
  defaults to all modules, to build specific modules supply a comma separated lists
```

# License
Licensed under [MIT](./LICENSE).
