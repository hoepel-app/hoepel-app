import * as firebase from '@firebase/testing'
import { FirestoreAgeGroupsRepository } from './firestore-age-groups-repository'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { AgeGroups, AgeGroup } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'

describe('FirestoreAgeGroupsRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  const exampleGroups = AgeGroups.create('my-tenant-id', 'new-school-year')
    .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
    .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
    .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
    .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  it('returns default empty age groups when nothing was saved', async () => {
    const repo = new FirestoreAgeGroupsRepository()

    const result = await repo
      .getForTenant('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(AgeGroups.createEmpty('something-tenant'))
  })

  it('can save and load age groups', async () => {
    const repo = new FirestoreAgeGroupsRepository()

    await repo.put(exampleGroups)

    const result = await repo
      .getForTenant('my-tenant-id')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(exampleGroups)
  })
})
