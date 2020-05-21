import * as firebase from '@firebase/testing'
import { FirestoreConsumablesRepository } from './firestore-consumables-repository'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { Consumable, Consumables } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'

describe('FirestoreConsumablesRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  const exampleConsumables = Consumables.createEmpty('my-tenant-here')
    .withConsumableAdded(Consumable.create('Cookie', 50))
    .withConsumableAdded(Consumable.create('Water', 0))
    .withConsumableAdded(Consumable.create('Soft drink', 150))

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  it('returns default empty consumables when nothing was saved', async () => {
    const repo = new FirestoreConsumablesRepository()

    const result = await repo
      .getForTenant('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(Consumables.createEmpty('something-tenant'))
  })

  it('can save and load consumables', async () => {
    const repo = new FirestoreConsumablesRepository()

    await repo.put(exampleConsumables)

    const result = await repo
      .getForTenant('my-tenant-here')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(exampleConsumables)
  })
})
