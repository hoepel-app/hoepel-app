import express from 'express'
import cors from 'cors'
import * as functions from 'firebase-functions'
import { logRequestStart } from './util/log-request'
import { RELEASE_ID } from './release'
import { ENVIRONMENT } from './environment'
import { server } from './graphql'
import * as Sentry from '@sentry/node'

import { router as organisationRouter } from './routes/organisation.routes'

const app = express()

Sentry.init({
  dsn: 'https://e2b8d5b8c87143948e4a0ca794fd06b2@sentry.io/1474167',
  release: RELEASE_ID,
  environment: ENVIRONMENT,
})

app.use(Sentry.Handlers.requestHandler())

// Log all requests
app.use(logRequestStart)

// Automatically allow cross-origin requests
app.use(cors({ origin: true, maxAge: 3600 }))

// Mount routes
app.use('/organisation', organisationRouter)

server.applyMiddleware({ path: '/graphql', app })

export const api = functions
  .region('europe-west1')
  .runWith({
    memory: '512MB',
  })
  .https.onRequest(app)
