import * as admin from 'firebase-admin'
import { FirebaseTenantIndexedRepository } from './repository'
import { Crew, ICrew, store, TenantIndexedRepository } from '@hoepel.app/types'

export type ICrewRepository = TenantIndexedRepository<Crew>

export const createCrewRepository = (
  db: admin.firestore.Firestore
): FirebaseTenantIndexedRepository<ICrew, Crew> =>
  new FirebaseTenantIndexedRepository<ICrew, Crew>(db, store.crewMembers)
