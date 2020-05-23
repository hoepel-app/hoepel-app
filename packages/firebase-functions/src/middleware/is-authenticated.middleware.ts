// Based on https://github.com/antonybudianto/express-firebase-middleware
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { asyncMiddleware } from '../util/async-middleware'
import { NotAuthenticatedError } from '../errors/not-authenticated.error'
import * as admin from 'firebase-admin'

export const firebaseIsAuthenticatedMiddleware: RequestHandler = asyncMiddleware(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.header('Authorization')
    if (authorization) {
      const token = authorization.split(' ')
      try {
        res.locals.user = await admin.auth().verifyIdToken(token[1])
        next()
      } catch (err) {
        throw new NotAuthenticatedError('Could not verify token', err)
      }
    } else {
      throw new NotAuthenticatedError('Authorization not found')
    }
  }
)
