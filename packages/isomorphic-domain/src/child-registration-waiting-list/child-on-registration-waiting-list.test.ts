import { Child, DayDate } from '@hoepel.app/types'
import { ChildOnRegistrationWaitingList } from './child-on-registration-waiting-list'

describe('ChildOnRegistrationWaitingList', () => {
  const childOnWaitingList = ChildOnRegistrationWaitingList.create({
    id: 'id-on-waiting-list',
    tenantId: 'my-tenant-id',
    newChild: {
      address: {
        street: 'NewStreet',
        number: 'NewNumber',
        city: 'NewCity',
        zipCode: 2222,
      },
      createdByParentUid: 'new-parent-uid',
      email: ['new@email.com'],
      firstName: 'NewFirstName',
      lastName: 'NewLastName',
      phone: [{ phoneNumber: 'new-phone-number', comment: 'new-comment' }],
      remarks: 'new remarks',
      birthDate: '2007-06-05',
      gender: 'female',
      uitpasNumber: 'new-uitpas-number',
    },
  })

  const minimalChild = ChildOnRegistrationWaitingList.create({
    id: 'id-on-waiting-list',
    tenantId: 'my-tenant-id',
    newChild: {
      address: {},
      createdByParentUid: 'new-parent-uid',
      email: [],
      firstName: 'NewFirstName',
      lastName: 'NewLastName',
      phone: [],
      remarks: '',
    },
  })

  it('serializing and deserializing yields same object', () => {
    const deserialized = ChildOnRegistrationWaitingList.fromProps(
      JSON.parse(JSON.stringify(childOnWaitingList.toProps()))
    )

    expect(deserialized).toEqual(childOnWaitingList)
  })

  describe('birthDate', () => {
    it('null for a child without one', () => {
      expect(minimalChild.birthDate).toBeNull()
    })

    it('DayDate object for a child with a birthdate', () => {
      expect(childOnWaitingList.birthDate).toMatchInlineSnapshot(`
        DayDate {
          "day": 5,
          "month": 6,
          "year": 2007,
        }
      `)
    })
  })

  describe('gender', () => {
    it('gives gender if set', () => {
      expect(childOnWaitingList.gender).toEqual('female')
    })

    it('returns null if no gender is set', () => {
      expect(minimalChild.gender).toBeNull()
    })
  })

  describe('makeChild', () => {
    it('can create a new child', () => {
      const result = childOnWaitingList.makeChild('my-new-child-id')

      expect(result).toMatchInlineSnapshot(`
        Child {
          "address": Address {
            "city": "NewCity",
            "number": "NewNumber",
            "street": "NewStreet",
            "zipCode": 2222,
          },
          "birthDate": DayDate {
            "day": 5,
            "month": 6,
            "year": 2007,
          },
          "contactPeople": Array [],
          "email": Array [
            "new@email.com",
          ],
          "firstName": "NewFirstName",
          "gender": "female",
          "id": "my-new-child-id",
          "lastName": "NewLastName",
          "managedByParents": Array [
            "new-parent-uid",
          ],
          "phone": Array [
            Object {
              "comment": "new-comment",
              "phoneNumber": "new-phone-number",
            },
          ],
          "remarks": "new remarks",
          "uitpasNumber": "new-uitpas-number",
        }
      `)
    })

    it('can create a new child with minimal properties', () => {
      expect(minimalChild).toMatchInlineSnapshot(`
        ChildOnRegistrationWaitingList {
          "props": Object {
            "id": "id-on-waiting-list",
            "newChild": Object {
              "address": Object {},
              "createdByParentUid": "new-parent-uid",
              "email": Array [],
              "firstName": "NewFirstName",
              "lastName": "NewLastName",
              "phone": Array [],
              "remarks": "",
            },
            "tenantId": "my-tenant-id",
          },
        }
      `)
    })
  })

  describe('mergeWithChild', () => {
    const existingChild = new Child({
      address: {
        street: 'ExistingStreet',
        number: 'ExistingNumber',
        city: 'ExistingCity',
        zipCode: 1111,
      },
      contactPeople: [
        {
          contactPersonId: 'existing-contact-person',
          relationship: 'existing-father',
        },
      ],
      email: ['existing@email.com'],
      firstName: 'ExistingFirstName',
      lastName: 'ExistingLastName',
      phone: [
        { phoneNumber: 'existing-phone', comment: 'existing-phone-comment' },
      ],
      remarks: 'Existing Remarks',
      birthDate: new DayDate({ day: 2, month: 3, year: 2004 }),
      gender: 'male',
      id: 'existing-id',
      managedByParents: ['existing-parent-uid'],
      uitpasNumber: 'existing-uitpas-number',
    })

    it('can merge a child on the registration waiting list with a new child', () => {
      const result = childOnWaitingList.mergeWithExistingChild(existingChild)

      expect(result).toMatchInlineSnapshot(`
        Child {
          "address": Address {
            "city": "NewCity",
            "number": "NewNumber",
            "street": "NewStreet",
            "zipCode": 2222,
          },
          "birthDate": DayDate {
            "day": 5,
            "month": 6,
            "year": 2007,
          },
          "contactPeople": Array [
            Object {
              "contactPersonId": "existing-contact-person",
              "relationship": "existing-father",
            },
          ],
          "email": Array [
            "new@email.com",
          ],
          "firstName": "NewFirstName",
          "gender": "male",
          "id": "existing-id",
          "lastName": "NewLastName",
          "managedByParents": Array [
            "existing-parent-uid",
            "new-parent-uid",
          ],
          "phone": Array [
            Object {
              "comment": "new-comment",
              "phoneNumber": "new-phone-number",
            },
          ],
          "remarks": "new remarks

        Toegevoegd door speelplein: Existing Remarks",
          "uitpasNumber": "new-uitpas-number",
        }
      `)
    })

    it('can merge a child on the waiting list with minimal properties with an existing child', () => {
      const result = minimalChild.mergeWithExistingChild(existingChild)

      expect(result).toMatchInlineSnapshot(`
        Child {
          "address": Address {
            "city": undefined,
            "number": undefined,
            "street": undefined,
            "zipCode": undefined,
          },
          "birthDate": DayDate {
            "day": 2,
            "month": 3,
            "year": 2004,
          },
          "contactPeople": Array [
            Object {
              "contactPersonId": "existing-contact-person",
              "relationship": "existing-father",
            },
          ],
          "email": Array [],
          "firstName": "NewFirstName",
          "gender": "male",
          "id": "existing-id",
          "lastName": "NewLastName",
          "managedByParents": Array [
            "existing-parent-uid",
            "new-parent-uid",
          ],
          "phone": Array [],
          "remarks": "

        Toegevoegd door speelplein: Existing Remarks",
          "uitpasNumber": undefined,
        }
      `)
    })
  })
})
