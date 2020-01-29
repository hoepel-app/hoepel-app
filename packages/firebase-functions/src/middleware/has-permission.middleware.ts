import { Request, Response, NextFunction, RequestHandler } from 'express'
import * as admin from 'firebase-admin'
import { asyncMiddleware } from '../util/async-middleware'
import { NoPermissionError } from '../errors/no-permission.error'

/**
 * Middleware to check if a user has the required permission
 *
 * @param db Firebase admin Firestore (e.g. admin.firestore())
 * @param permissionNeeded The needed permission.
 * @param allowAdmin If true, allow admin to access this route even if permission is missing
 */
export const firebaseHasPermissionMiddleware = (
  db: admin.firestore.Firestore,
  permissionNeeded: string,
  allowAdmin = true
): RequestHandler => {
  return asyncMiddleware(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const uid = res.locals.user.uid
      const isAdmin = !!res.locals.user.isAdmin
      const tenant = req.params.tenant || res.locals.tenant

      if (!uid) {
        throw new NoPermissionError('No uid found')
      }

      // Allow admin to access this resource
      if (isAdmin && allowAdmin) {
        next()
        return Promise.resolve()
      }

      if (!tenant) {
        throw new NoPermissionError(
          'No tenant set and not admin or admin not allowed',
          {
            tenant,
            isAdmin,
            adminAllowed: allowAdmin,
          }
        )
      }

      try {
        const permissionsDoc = await db
          .collection('users')
          .doc(uid)
          .collection('tenants')
          .doc(tenant)
          .get()

        if (
          !permissionNeeded ||
          !permissionsDoc.exists ||
          !permissionsDoc.data() ||
          !permissionsDoc.data().permissions ||
          !permissionsDoc.data().permissions.includes(permissionNeeded)
        ) {
          throw new NoPermissionError('No permission to access this resource', {
            permissionsDocExists: permissionsDoc.exists,
            permissionNeeded,
            permissions: permissionsDoc.data()?.permissions,
            tenant,
          })
        } else {
          next()
        }
      } catch (err) {
        if (err instanceof NoPermissionError) {
          throw err // re-throw local error
        } else {
          throw new NoPermissionError(
            'Unexpected error checking permission',
            { tenant },
            err
          )
        }
      }
    }
  )
}

/**
 * Middleware that only allows access for admin users
 */
export const firebaseIsAdminMiddleware = (
  db: admin.firestore.Firestore
): RequestHandler => firebaseHasPermissionMiddleware(db, null, true)
