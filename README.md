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

## THIS IS A WIP

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

install the package (It's not currently available on NPM, you'll have to use the Github repository)

```
npm install --save-dev @bedr0ck/cli
```

This will automatically install the required packages

## Create a bedrock.config.js configuration

use the following as a template for your bedrock.config.js

```javascript
// bedrock.config.js
// IMPORTANT: This file is not going through babel transformation.
// You can however use the ES2015 features supported by your Node.js version.
module.exports = {
  // Name of addon
  // @optional
  // @default package.json > name
  name:         'string',

  // Version of addon
  // @optional,
  // @default package.json > version
  version:      'string',

  // Description of addon
  // @optional
  // @default package.json > description
  description:  'string',

  // Base directory for source and distributable files
  // @optional
  // @default process.cwd()
  rootDir: 'string',

  // Directory for source files,
  // @optional,
  // @default src
  srcDir: 'string',

  // Directory for distributable files
  // @optional
  // @default dist
  outDir: 'string',

  nameing: {
    // Name of the packaged mcaddon file
    // @optional
    // @default {project}-{projectVer}.mcaddon
    mcaddon: 'string',

    // Name of the packaged mcpack file
    // @optional
    // @default {module}-{moduleVer}.mcpack
    mcpack: 'string',

    // Name of the folder to install in you local bedrock
    // @optional
    // @default {project}-{module}
    install: 'string',
  },
	webpack(config, options, mod, webpack) {
    // Perform customizations to config
    // Important: return the modified config
    return config
  }
}
```

Next, update your package.json with appropriate scripts, here are some useful scripts

```json
  "scripts": {
    "build": "bedrock build",
    "watch": "bedrock watch",
    "install": "bedrock install",
    "uninstall": "bedrock install",
    "init": "bedrock init",
  },
```

-   use **npm run build** to create the directory structure for a .mcaddon
-   use **npm run install** to install the addon into Minecraft for Windows 10
-   use **npm run uninstall** to uninstall the addon into Minecraft for Windows 10
-   use **npm run watch** to:
    -   build the project
    -   deploy it to to Minecraft for Windows 10
    -   monitor for changes on the filesystem
        -   automatically rebuilds and deploys the project.
-   use **npm run init** to create a new boilerplate module

## Conventions

These scripts will assume a certain directory structure by default. These can be overridden by altering properties on the `srcDir` and `outDir` objects in your bedrock.config.js.

| directory      | purpose                                                                                                                | config property |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| .\src          | place a directory in here for each pack you have. The type of the pack will be determined by it's `manifest.json` file | srcDir          |
| .\dest         | the constructed pack directories will be assembled here, ready for deployment into Minecraft                           | outDir          |
| .\dest         | constructed .mcpack and .mcaddon files will be placed here                                                             | outDir          |

# License
Licensed under [MIT](./LICENSE).
