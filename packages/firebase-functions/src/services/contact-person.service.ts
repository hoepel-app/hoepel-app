import * as admin from 'firebase-admin'
import {
  ContactPerson,
  IContactPerson,
  store,
  TenantIndexedRepository,
} from '@hoepel.app/types'
import { FirebaseTenantIndexedRepository } from './repository'

export type IContactPersonRepository = TenantIndexedRepository<ContactPerson>

export const createContactPersonRepository = (
  db: admin.firestore.Firestore
): FirebaseTenantIndexedRepository<IContactPerson, ContactPerson> =>
  new FirebaseTenantIndexedRepository<IContactPerson, ContactPerson>(
    db,
    store.contactPeople
  )
