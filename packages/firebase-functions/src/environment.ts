import * as functions from 'firebase-functions'

export const ENVIRONMENT =
  functions.config().runtime.environment || 'development'
