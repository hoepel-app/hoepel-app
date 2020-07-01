import express, { ErrorRequestHandler } from 'express'
import cors from 'cors'
import * as functions from 'firebase-functions'
import { logRequestStart } from './util/log-request'
import { RELEASE_ID } from './release'
import { ENVIRONMENT } from './environment'
import { server } from './graphql'
import * as Sentry from '@sentry/node'

import { router as organisationRouter } from './routes/organisation.routes'
import admin from 'firebase-admin'

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

app.use('/version', (req, res) => res.json({ release: RELEASE_ID }))
app.use('/', (req, res) => res.json({}))

// Error handlers

app.use((err, req, res, next) => {
  Sentry.configureScope((scope) => {
    const authorization = req.header('Authorization')

    if (!authorization || !authorization?.split(' ')?.[0]) {
      next(err)
      return
    }

    const token = authorization.split(' ')

    admin
      .auth()
      .verifyIdToken(token[1])
      .then((user) => {
        scope.setUser({
          email: user.email,
          id: user.uid,
          username: user.name,
          // eslint-disable-next-line @typescript-eslint/camelcase
          ip_address: req.header('X-Forwarded-For'),
        })

        next(err)
      })
      .catch(() => next(err))
  })
}, Sentry.Handlers.errorHandler())

const errorRequestHandler: ErrorRequestHandler = (err, req, res) => {
  console.error(err)
  if (err.cause) {
    console.error('Cause:')
    console.error(err.cause)
  }

  res.status(500).json({
    status: 'error',
    message: err.message,
    cause: err.cause?.message,
  })
}

app.use(errorRequestHandler)

export const api = functions
  .region('europe-west1')
  .runWith({
    memory: '512MB',
  })
  .https.onRequest(app)
