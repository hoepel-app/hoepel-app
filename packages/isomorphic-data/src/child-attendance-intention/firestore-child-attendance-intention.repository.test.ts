import * as firebase from '@firebase/testing'
import { injectTestingAdaptor } from 'typesaurus/testing'
import {
  ChildAttendanceIntention,
  WeekIdentifier,
} from '@hoepel.app/isomorphic-domain'
import { FirestoreChildAttendanceIntentionRepository } from './firestore-child-attendance-intention.repository'
import { first } from 'rxjs/operators'

describe('FirestoreChildAttendanceIntentionRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  const date = new Date(1591977733296)

  const att1 = ChildAttendanceIntention.create(
    'my-tenant-id',
    'child-1',
    null,
    2020,
    40,
    ['shift-1', 'shift-2'],
    date
  )
  const att2 = ChildAttendanceIntention.create(
    'my-tenant-id',
    'child-2',
    null,
    2020,
    40,
    ['shift-1'],
    date
  )
  const att3 = ChildAttendanceIntention.create(
    'my-tenant-id',
    'child-1',
    null,
    2020,
    9,
    ['shift-5', 'shift-6'],
    date
  )
  const att4 = ChildAttendanceIntention.create(
    'other-tenant-id',
    'child-5',
    null,
    2020,
    9,
    ['shift-15', 'shift-16'],
    date
  )

  it('returns default empty array when nothing was saved', async () => {
    const repo = new FirestoreChildAttendanceIntentionRepository()

    const result = await repo
      .findForWeek('my-tenant-id', new WeekIdentifier(2020, 40))
      .pipe(first())
      .toPromise()

    expect(result).toEqual([])
  })

  test('findForWeek', async () => {
    const repo = new FirestoreChildAttendanceIntentionRepository()

    await repo.put(att1)
    await repo.put(att2)
    await repo.put(att3)
    await repo.put(att4)

    const byWeek1 = await repo
      .findForWeek('my-tenant-id', new WeekIdentifier(2020, 9))
      .pipe(first())
      .toPromise()
    const byWeek2 = await repo
      .findForWeek('my-tenant-id', new WeekIdentifier(2020, 40))
      .pipe(first())
      .toPromise()
    const byWeek3 = await repo
      .findForWeek('my-tenant-id', new WeekIdentifier(2020, 12))
      .pipe(first())
      .toPromise()

    expect(byWeek1).toEqual([att3])
    expect(byWeek2).toEqual([att1, att2])
    expect(byWeek3).toEqual([])
  })

  test('findForWeek', async () => {
    const repo = new FirestoreChildAttendanceIntentionRepository()

    await repo.put(att1)
    await repo.put(att2)
    await repo.put(att3)
    await repo.put(att4)

    const res1 = await repo
      .findForChild('my-tenant-id', 'child-1')
      .pipe(first())
      .toPromise()

    const res2 = await repo
      .findForChild('my-tenant-id', 'child-5')
      .pipe(first())
      .toPromise()

    expect(res1).toEqual([att1, att3])
    expect(res2).toEqual([])
  })

  test('findForWeek', async () => {
    const repo = new FirestoreChildAttendanceIntentionRepository()

    await repo.put(att1)
    await repo.put(att2)
    await repo.put(att3)
    await repo.put(att4)

    const res1 = await repo
      .findForChildInWeek(
        'my-tenant-id',
        'child-1',
        new WeekIdentifier(2020, 9)
      )
      .pipe(first())
      .toPromise()

    const res2 = await repo
      .findForChildInWeek(
        'my-tenant-id',
        'child-5',
        new WeekIdentifier(2020, 9)
      )
      .pipe(first())
      .toPromise()

    expect(res1).toEqual(att3)
    expect(res2).toEqual(null)
  })
})
