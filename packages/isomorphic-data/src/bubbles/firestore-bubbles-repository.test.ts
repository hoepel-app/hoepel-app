import * as firebase from '@firebase/testing'
import { FirestoreBubblesRepository } from './firestore-bubbles-repository'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { Bubbles, Bubble } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'

describe('FirestoreBubblesRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  const exampleGroups = Bubbles.createEmpty('my-tenant-id')
    .withBubbleAdded(Bubble.create('My bubble name', 40, []))
    .withBubbleAdded(Bubble.create('Another bubble', 10, ['child-id-1']))

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  it('returns default empty bubbles when nothing was saved', async () => {
    const repo = new FirestoreBubblesRepository()

    const result = await repo
      .getForTenant('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(Bubbles.createEmpty('something-tenant'))
  })

  it('can save and load bubbles', async () => {
    const repo = new FirestoreBubblesRepository()

    await repo.put(exampleGroups)

    const result = await repo
      .getForTenant('my-tenant-id')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(exampleGroups)
  })
})
