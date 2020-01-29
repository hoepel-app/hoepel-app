import * as admin from 'firebase-admin'
import {
  Child,
  IChild,
  store,
  TenantIndexedRepository,
} from '@hoepel.app/types'
import { FirebaseTenantIndexedRepository } from './repository'

export type IChildRepository = TenantIndexedRepository<Child>

export const createChildRepository = (
  db: admin.firestore.Firestore
): FirebaseTenantIndexedRepository<IChild, Child> =>
  new FirebaseTenantIndexedRepository<IChild, Child>(db, store.children)
