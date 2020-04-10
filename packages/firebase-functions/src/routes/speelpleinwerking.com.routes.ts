import { Router } from 'express'
import * as admin from 'firebase-admin'
import {
  Child,
  IChild,
  DocumentNotFoundError,
  IncorrectTenantError,
} from '@hoepel.app/types'
import { firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware } from '../middleware/is-authenticated.middleware'
import { asyncMiddleware } from '../util/async-middleware'
import { createChildRepository } from '../services/child.service'

const db = admin.firestore()

export const router = Router()

const childRepo = createChildRepository(db)

router.use(firebaseIsAuthenticatedSpeelpleinwerkingDotComMiddleware)

router.get(
  '/organisation/:organisation/children/managed-by/me',
  asyncMiddleware(async (req, res) => {
    const parentUid = res.locals.user.uid
    const organisationId = req.params.organisation

    const children: ReadonlyArray<Child> = (
      await db
        .collection('children')
        .where('managedByParents', 'array-contains', parentUid)
        .where('tenant', '==', organisationId)
        .get()
    ).docs.map(
      snapshot => new Child({ ...(snapshot.data() as IChild), id: snapshot.id })
    )

    res.json(children)
  })
)

router.get(
  '/organisation/:organisation/children/managed-by/:parentUid',
  asyncMiddleware(async (req, res) => {
    const parentUid = req.params.parentUid
    const organisationId = req.params.organisation

    if (parentUid !== res.locals.user.uid) {
      res
        .json(403)
        .json({ error: 'You can only view children managed by yourself' })
      return
    }

    const children: ReadonlyArray<Child> = (
      await db
        .collection('children')
        .where('managedByParents', 'array-contains', parentUid)
        .where('tenant', '==', organisationId)
        .get()
    ).docs.map(
      snapshot => new Child({ ...(snapshot.data() as IChild), id: snapshot.id })
    )

    res.json(children)
  })
)

router.put(
  '/organisation/:organisation/children/:child',
  asyncMiddleware(async (req, res) => {
    const childId = req.params.child
    const organisationId = req.params.organisation
    const parentUid = res.locals.user.uid

    try {
      const child = await childRepo.get(organisationId, childId)

      if (
        !(child.managedByParents || ([] as ReadonlyArray<string>)).includes(
          parentUid
        )
      ) {
        res.status(403).json({
          error: `Parent can not edit child since parent uid (${parentUid}) is not included in ${JSON.stringify(
            child.managedByParents
          )}`,
        })
      } else {
        // First, create a new child object. This way, only valid properties are kept
        // Then stringify and parse as JSON. We get a plain JS object
        // Finally, drop the id
        const { id, ...newChild } = JSON.parse(
          JSON.stringify(new Child(req.body.child))
        )
        const newChildWithTenant = { ...newChild, tenant: organisationId }

        await db
          .collection('children')
          .doc(childId)
          .set(newChildWithTenant)

        res.status(200).json({})
      }
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        res.status(404).json({ error: 'Child not found' })
      } else if (err instanceof IncorrectTenantError) {
        res.status(403).json({
          error: `Tenant id on child (${err.expectedTenant}) does not match given tenant id (${err.foundTenant})`,
        })
      } else {
        throw err
      }
    }
  })
)

router.post(
  '/organisation/:organisation/children',
  asyncMiddleware(async (req, res) => {
    const organisationId = req.params.organisation
    const parentUid = res.locals.user.uid

    // First, create a new child object. This way, only valid properties are kept
    // Then stringify and parse as JSON. We get a plain JS object
    // Finally, drop the id
    const { id, ...newChild } = JSON.parse(
      JSON.stringify(
        new Child(req.body.child).withManagedByParents([parentUid])
      )
    )
    const newChildWithTenant = { ...newChild, tenant: organisationId }

    await db.collection('children').add(newChildWithTenant)

    res.status(200).json({})
  })
)
