// Based on https://github.com/antonybudianto/express-firebase-middleware
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { verifyJwt } from '../util/verify-jwt'
import { asyncMiddleware } from '../util/async-middleware'
import { NotAuthenticatedError } from '../errors/not-authenticated.error'

export const firebaseIsAuthenticatedMiddleware = (
  admin: any
): RequestHandler => {
  return asyncMiddleware(
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
}

export const firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware = (
  admin: any
): RequestHandler => {
  return asyncMiddleware(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const authorization = req.header('Authorization')

      if (authorization) {
        const token = authorization.split(' ')

        try {
          const decodedToken = await verifyJwt(token[1])
          if (!decodedToken) {
            throw new NotAuthenticatedError('Could not verify token')
          } else {
            res.locals.user = decodedToken
            res.locals.user.uid = (decodedToken as any).user_id
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
}
