import { firebaseIsAdminMiddleware } from '../middleware/has-permission.middleware'
import { Router } from 'express'
import { UserService } from '../services/user.service'
import * as admin from 'firebase-admin'
import { firebaseIsAuthenticatedMiddleware } from '../middleware/is-authenticated.middleware'
import { asyncMiddleware } from '../util/async-middleware'

const db = admin.firestore()
const auth = admin.auth()
const userService = new UserService(db, auth)

export const router = Router()

// Parse Firebase tokens
router.use(firebaseIsAuthenticatedMiddleware)

// Routes
router.get(
  '/all',
  firebaseIsAdminMiddleware(db),
  asyncMiddleware(async (req, res) => {
    const maxResults = parseInt(req.query.maxResults, 10)
    const data = await userService.getUsers(
      maxResults || undefined,
      req.query.pageToken || undefined
    )
    res.json({ data })
  })
)

router.get(
  '/:uid',
  firebaseIsAdminMiddleware(db),
  asyncMiddleware(async (req, res) => {
    const data = await userService.getUser(req.params.uid)
    res.json({ data })
  })
)
