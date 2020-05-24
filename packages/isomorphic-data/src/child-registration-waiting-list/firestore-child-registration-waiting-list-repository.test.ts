import * as firebase from '@firebase/testing'
import { injectTestingAdaptor } from 'typesaurus/testing'
import { ChildOnRegistrationWaitingList } from '@hoepel.app/isomorphic-domain'
import { FirestoreChildRegistrationWaitingListRepository } from './firestore-child-registration-waiting-list-repository'
import { first } from 'rxjs/operators'

describe('FirestoreChildRegistrationWaitingListRepository', () => {
  let app: ReturnType<typeof firebase.initializeAdminApp> | undefined

  beforeEach(() => {
    app = firebase.initializeAdminApp({ projectId: 'project-id' })
    injectTestingAdaptor(app)
  })

  afterEach(async () => {
    await app?.delete()
  })

  const childOnWaitingList1 = ChildOnRegistrationWaitingList.create({
    id: 'id-on-waiting-list-1',
    tenant: 'my-tenant-id',
    newChild: {
      address: {
        street: 'NewStreet',
        number: 'NewNumber',
        city: 'NewCity',
        zipCode: 2222,
      },
      createdByParentUid: 'new-parent-uid',
      email: ['new@email.com'],
      firstName: 'NewFirstName1',
      lastName: 'NewLastName1',
      phone: [{ phoneNumber: 'new-phone-number', comment: 'new-comment' }],
      remarks: 'new remarks',
      birthDate: '2007-06-05',
      gender: 'female',
      uitpasNumber: 'new-uitpas-number',
    },
  })

  const childOnWaitingList2 = ChildOnRegistrationWaitingList.create({
    id: 'id-on-waiting-list-2',
    tenant: 'my-tenant-id',
    newChild: {
      address: {
        street: 'NewStreet',
        number: 'NewNumber',
        city: 'NewCity',
        zipCode: 2222,
      },
      createdByParentUid: 'new-parent-uid',
      email: ['new@email.com'],
      firstName: 'NewFirstName2',
      lastName: 'NewLastName2',
      phone: [{ phoneNumber: 'new-phone-number', comment: 'new-comment' }],
      remarks: 'new remarks',
      birthDate: '2007-06-05',
      gender: 'female',
      uitpasNumber: 'new-uitpas-number',
    },
  })

  const childOnWaitingList3 = ChildOnRegistrationWaitingList.create({
    id: 'id-on-waiting-list-3',
    tenant: 'other-tenant-id',
    newChild: {
      address: {
        street: 'NewStreet',
        number: 'NewNumber',
        city: 'NewCity',
        zipCode: 2222,
      },
      createdByParentUid: 'new-parent-uid',
      email: ['new@email.com'],
      firstName: 'NewFirstName3',
      lastName: 'NewLastName3',
      phone: [{ phoneNumber: 'new-phone-number', comment: 'new-comment' }],
      remarks: 'new remarks',
      birthDate: '2007-06-05',
      gender: 'female',
      uitpasNumber: 'new-uitpas-number',
    },
  })

  it('returns default empty array when nothing was saved', async () => {
    const repo = new FirestoreChildRegistrationWaitingListRepository()

    const result = await repo
      .getAll('something-tenant')
      .pipe(first())
      .toPromise()

    expect(result).toEqual([])
  })

  it('can save and load children in waiting list', async () => {
    const repo = new FirestoreChildRegistrationWaitingListRepository()

    await repo.add(childOnWaitingList1)

    const result = await repo
      .getById('my-tenant-id', childOnWaitingList1.id)
      .pipe(first())
      .toPromise()

    expect(result).toEqual(childOnWaitingList1)

    const wrongTenantIdResult = await repo
      .getById('wrong-tenant-id', childOnWaitingList1.id)
      .pipe(first())
      .toPromise()

    expect(wrongTenantIdResult).toBeNull()

    const nonexistantId = await repo
      .getById('my-tenant-id', 'id-does-not-exist')
      .pipe(first())
      .toPromise()

    expect(nonexistantId).toBeNull()
  })

  it('can remove children from waiting list', async () => {
    const repo = new FirestoreChildRegistrationWaitingListRepository()

    await repo.add(childOnWaitingList1)

    const result = await repo
      .getById('my-tenant-id', childOnWaitingList1.id)
      .pipe(first())
      .toPromise()

    expect(result).toEqual(childOnWaitingList1)

    await repo.delete('my-tenant-id', childOnWaitingList1.id)

    const nonexistantId = await repo
      .getById('my-tenant-id', childOnWaitingList1.id)
      .pipe(first())
      .toPromise()

    expect(nonexistantId).toBeNull()
  })

  it('can get all children on the registration waiting list for a tenant', async () => {
    const repo = new FirestoreChildRegistrationWaitingListRepository()

    await repo.add(childOnWaitingList1)
    await repo.add(childOnWaitingList2)
    await repo.add(childOnWaitingList3)

    const firstTenant = await repo
      .getAll('my-tenant-id')
      .pipe(first())
      .toPromise()
    const otherTenant = await repo
      .getAll('other-tenant-id')
      .pipe(first())
      .toPromise()
    const doesNotExistTenant = await repo
      .getAll('blah-tenant-id')
      .pipe(first())
      .toPromise()

    expect(firstTenant).toEqual([childOnWaitingList1, childOnWaitingList2])
    expect(otherTenant).toEqual([childOnWaitingList3])
    expect(doesNotExistTenant).toEqual([])
  })
})
