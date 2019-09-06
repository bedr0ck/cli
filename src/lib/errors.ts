import * as Ajv from 'ajv'
import { Bedr0ck } from './bedr0ck'

export class NoPackage extends Error {
  constructor(message: string, b: Bedr0ck) {
    super(message)
  }
}

export class NoConfig extends Error {
  constructor(message: string, b: Bedr0ck) {
    super(message)
  }
}

export class NoModules extends Error {
  constructor(message: string, b: Bedr0ck) {
    super(message)
  }
}

type ManifestError = Error | Ajv.ErrorObject[] | null | undefined

export class InvalidManifest extends Error {
  public errors: ManifestError

  constructor(message: string, b: Bedr0ck, errors: ManifestError) {
    super(message)
    this.errors = errors
  }
}
