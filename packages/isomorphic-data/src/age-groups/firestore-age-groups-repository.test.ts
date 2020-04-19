// import * as firebase from '@firebase/testing'
// import { FirestoreAgeGroupsRepository } from './firestore-age-groups-repository'
// import { injectTestingAdaptor } from 'typesaurus/testing'
// import { AgeGroups } from '@hoepel.app/isomorphic-domain'

// describe('FirestoreAgeGroupsRepository', () => {
//   let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

//   beforeEach(() => {
//     app = firebase.initializeAdminApp({ projectId: 'project-id' })
//     injectTestingAdaptor(app)
//   })

//   afterEach(async () => {
//     await app?.delete()
//   })

//   it('returns default empty age groups when nothing was saved', async () => {
//     const repo = new FirestoreAgeGroupsRepository()

//     const result = await repo.findForTenant('my-tenant-name')

//     expect(result).toEqual(AgeGroups.createEmpty())
//   })
// })
