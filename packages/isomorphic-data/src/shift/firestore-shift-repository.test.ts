import * as firebase from '@firebase/testing'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { first } from 'rxjs/operators'
import { FirestoreShiftRepository } from './firestore-shift-repository'
import { ShiftPreset, Shift } from '@hoepel.app/isomorphic-domain'
import { Observable } from 'rxjs'
import { DayDate } from '@hoepel.app/types'

const observableToPromise = <T>(ob: Observable<T>): Promise<T> =>
  ob.pipe(first()).toPromise()

describe('FirestoreShiftRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  const shiftPreset = ShiftPreset.createEmpty('my-tenant-name')

  const shift1 = Shift.createFromPreset(
    'my-tenant-here',
    'shift-id-1',
    DayDate.fromDayId('2020-05-16'),
    shiftPreset
  )
  const shift2 = Shift.createFromPreset(
    'my-tenant-here',
    'shift-id-2',
    DayDate.fromDayId('2019-12-31'),
    shiftPreset
  )
  const shift3 = Shift.createFromPreset(
    'my-tenant-here',
    'shift-id-3',
    DayDate.fromDayId('2020-01-01'),
    shiftPreset
  )
  const shift4 = Shift.createFromPreset(
    'my-tenant-here',
    'shift-id-4',
    DayDate.fromDayId('2020-12-31'),
    shiftPreset
  )
  const shift5 = Shift.createFromPreset(
    'other-tenant-here',
    'shift-id-5',
    DayDate.fromDayId('2020-09-16'),
    shiftPreset
  )

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  it('returns default empty list when nothing was saved', async () => {
    const repo = new FirestoreShiftRepository()

    const result = await repo
      .findAll('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual([])
  })

  it('can save and load a shift', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift1,
    ])
    expect(
      await observableToPromise(repo.findAll('other-tenant-here'))
    ).toEqual([])
    expect(
      await observableToPromise(repo.getById('my-tenant-here', 'shift-id-1'))
    ).toEqual(shift1)
    expect(
      await observableToPromise(repo.getById('other-tenant-here', 'shift-id-1'))
    ).toEqual(null)
  })

  it('updates a shift', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift1,
    ])

    await repo.update(shift1.withChildrenCanAttend(false))

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift1.withChildrenCanAttend(false),
    ])
  })

  it('deletes a shift', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift1,
    ])

    await repo.delete('my-tenant-here', shift1.id)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual(
      []
    )
  })

  it('finds all shifts in a year', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)
    await repo.create(shift2)
    await repo.create(shift3)
    await repo.create(shift4)
    await repo.create(shift5)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift4,
      shift1,
      shift3,
      shift2,
    ])

    expect(
      await observableToPromise(repo.findInYear('my-tenant-here', 2020))
    ).toEqual([shift4, shift1, shift3])
  })

  it('can find all shifts between two dates', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)
    await repo.create(shift2)
    await repo.create(shift3)
    await repo.create(shift4)
    await repo.create(shift5)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift4,
      shift1,
      shift3,
      shift2,
    ])

    expect(
      await observableToPromise(
        repo.findBetweenDatesInclusive(
          'my-tenant-here',
          DayDate.fromDayId('2019-08-11'),
          DayDate.fromDayId('2020-09-16')
        )
      )
    ).toEqual([shift1, shift3, shift2])
  })

  it('finds all shifts on a day', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)
    await repo.create(shift2)
    await repo.create(shift3)
    await repo.create(shift4)
    await repo.create(shift5)

    expect(
      await observableToPromise(
        repo.findOnDay('my-tenant-here', DayDate.fromDayId('2020-05-16'))
      )
    ).toEqual([shift1])

    expect(
      await observableToPromise(
        repo.findOnDay('my-tenant-here', DayDate.fromDayId('2020-06-20'))
      )
    ).toEqual([])
  })

  it('finds many shifts', async () => {
    const repo = new FirestoreShiftRepository()

    await repo.create(shift1)
    await repo.create(shift2)
    await repo.create(shift3)
    await repo.create(shift4)
    await repo.create(shift5)

    expect(await observableToPromise(repo.findAll('my-tenant-here'))).toEqual([
      shift4,
      shift1,
      shift3,
      shift2,
    ])

    const manyResult = await observableToPromise(
      repo.findMany('my-tenant-here', [
        'shift-id-1',
        'shift-id-2',
        'shift-id-3',
        'shift-id-4',
        'shift-id-5',
      ])
    )

    expect(manyResult).toEqual([shift4, shift1, shift3, shift2])
  })
})
