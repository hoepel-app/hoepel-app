import * as admin from 'firebase-admin'
import { Router } from 'express'
import { firebaseIsAuthenticatedMiddleware } from '../middleware/is-authenticated.middleware'
import { firebaseHasPermissionMiddleware } from '../middleware/has-permission.middleware'
import { OrganisationService } from '../services/organisation.service'
import { asyncMiddleware } from '../util/async-middleware'

const db = admin.firestore()
const auth = admin.auth()
const organisationService = new OrganisationService(db, auth)

export const router = Router()

router.use(firebaseIsAuthenticatedMiddleware)

router.post(
  '/request',
  asyncMiddleware(async (req, res) => {
    console.log(
      `New organisation requested by ${res.locals.user.uid}: ${JSON.stringify(
        req.body
      )}`
    )
    await organisationService.requestCreateNewOrganisation(
      req.body.organisation,
      res.locals.user
    )
    res.json({})
  })
)

router.get(
  '/:tenant/members',
  firebaseHasPermissionMiddleware(db, 'tenant:list-members'),
  asyncMiddleware(async (req, res) => {
    const members = await organisationService.listMembers(req.params.tenant)
    res.json({ data: members })
  })
)

router.get(
  '/:tenant/possible-members',
  firebaseHasPermissionMiddleware(db, 'tenant:list-members'),
  asyncMiddleware(async (req, res) => {
    const possibleMembers = await organisationService.listPossibleMembers(
      req.params.tenant
    )
    res.json({ data: possibleMembers })
  })
)
