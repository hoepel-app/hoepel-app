// Based on https://github.com/antonybudianto/express-firebase-middleware
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { verifyJwt } from '../util/verify-jwt'
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

export const firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware: RequestHandler = asyncMiddleware(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.header('Authorization')

    if (authorization) {
      const token = authorization.split(' ')

      try {
        const decodedToken = await verifyJwt(token[1])
        if (decodedToken == null) {
          throw new NotAuthenticatedError('Could not verify token')
        } else {
          res.locals.user = decodedToken
          res.locals.user.uid = decodedToken.user_id
          next()
        }
      } catch (err) {
        throw new NotAuthenticatedError('Could not verify token', err)
      }
    } else {
      throw new NotAuthenticatedError('Authorization not found')
    }
  }
)
