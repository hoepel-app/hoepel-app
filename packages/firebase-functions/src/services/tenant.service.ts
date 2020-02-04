import * as admin from 'firebase-admin'
import { Tenant, ITenant, store } from '@hoepel.app/types'
import { FirebaseRepository } from './repository'

export type ITenantRepository = FirebaseRepository<ITenant, Tenant>

export const createTenantRepository = (
  db: admin.firestore.Firestore
): FirebaseRepository<ITenant, Tenant> =>
  new FirebaseRepository<ITenant, Tenant>(db, store.tenants)
