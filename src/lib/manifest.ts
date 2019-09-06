export interface IManifest {
  format_version: number
  header: {
    name: string,
    description: string,
    uuid: string,
    min_engine_version?: [number, number, number],
    version: [number, number, number],
  }
  modules: IModule[],
  dependencies?: IDependency[],
  capabilities?: string[]
  metadata?: {
    authors: string,
    license: string,
    url: string,
  }
}

export interface IModule {
  type: 'resources' | 'interface' | 'client_data' | 'data' | 'world_template',
  description: string,
  uuid: string,
  version: [number, number, number],
}

export interface IDependency {
  uuid: string,
  version: [number, number, number],
}

const str = { type: 'string' }
const uuid = { type: 'string', format: 'uuid' }
const version = {
  type: 'array',
  items: { type: 'number' },
  minItems: 3,
  maxItems: 3,
}

export const shemea = {
  type: 'object',
  properties: {
    format_version: { type: 'number' },

    header: {
      type: 'object',
      properties: {
        name: str,
        description: str,
        uuid,
        min_engine_version: version,
        version,
      },
      additionalProperties: false,
    },

    dependencies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uuid,
          version,
        },
        additionalProperties: false,
      },
    },

    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: str,
          type: { type: 'string', enum: ['resources', 'interface', 'client_data', 'data', 'world_template'] },
          uuid,
          version,
        },
        additionalProperties: false,
      },
    },

    capabilities: {
      type: 'array',
      items: { type: 'string', enum: ['experimental_custom_ui', 'chemistry'] },
    },

    metadata: {
      type: 'object',
      properties: {
        authors: str,
        license: str,
        url: str,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
}
