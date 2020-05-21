import * as firebase from '@firebase/testing'
import { FirestoreShiftPresetsRepository } from './firestore-shift-presets-repository'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { ShiftPresets, ShiftPreset } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'

describe('FirestoreShiftPresetsGroupsRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  const examplePresets = ShiftPresets.createEmpty('my-tenant-id')
    .withPresetAdded(
      ShiftPreset.createEmpty('Noon')
        .withCrewCanBePresent(false)
        .withDescription('Food')
        .withLocation('Location')
    )
    .withPresetAdded(ShiftPreset.createEmpty('Swimming'))
    .withPresetAdded(
      ShiftPreset.createEmpty('Crew activity').withChildrenCanBePresent(false)
    )

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  it('returns default empty shift presets when nothing was saved', async () => {
    const repo = new FirestoreShiftPresetsRepository()

    const result = await repo
      .getForTenant('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(ShiftPresets.createEmpty('something-tenant'))
  })

  it('can save and load shift presets groups', async () => {
    const repo = new FirestoreShiftPresetsRepository()

    await repo.put(examplePresets)

    const result = await repo
      .getForTenant('my-tenant-id')
      .pipe(first())
      .toPromise()

    expect(result).toEqual(examplePresets)
  })
})
