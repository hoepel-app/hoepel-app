import { AddressDomainService } from './address.domain-service'
import {
  Address,
  Child,
  ContactPerson,
  TenantIndexedRepository,
} from '@hoepel.app/types'

describe('AddressService#getAddressForChild', () => {
  it('gets address from child when it is valid', async () => {
    const contactPersonRepository = {
      get(tenant: string, id: string) {
        if (tenant === 'tenant2' && id === 'id-123') {
          return Promise.resolve(
            new ContactPerson({
              firstName: 'test',
              lastName: 'test',
              address: {
                street: 'contact street 1',
                number: 'contact number 1',
                city: 'contact city 1',
                zipCode: 654,
              },
              phone: [],
              email: [],
              remarks: '',
            })
          )
        } else {
          throw new Error('Unexpected contact person id')
        }
      },
    } as TenantIndexedRepository<ContactPerson>

    const addressService = new AddressDomainService(contactPersonRepository)

    const child = Child.empty().withAddress(
      new Address({
        city: 'city1',
        street: 'street1',
        number: 'number1',
        zipCode: 12345,
      })
    )

    const address = await addressService.getAddressForChild('tenant1', child)

    expect(address).toMatchInlineSnapshot(`
      Address {
        "city": "city1",
        "number": "number1",
        "street": "street1",
        "zipCode": 12345,
      }
    `)
  })

  it('Get address from primary contact person when child has no valid address', async () => {
    const contactPersonRepository = {
      get(tenant: string, id: string) {
        if (tenant === 'tenant2' && id === 'id-123') {
          return Promise.resolve(
            new ContactPerson({
              firstName: 'test',
              lastName: 'test',
              address: {
                street: 'contact street 1',
                number: 'contact number 1',
                city: 'contact city 1',
                zipCode: 654,
              },
              phone: [],
              email: [],
              remarks: '',
            })
          )
        } else {
          throw new Error('Unexpected contact person id')
        }
      },
    } as TenantIndexedRepository<ContactPerson>

    const addressService = new AddressDomainService(contactPersonRepository)

    const child = Child.empty()
      .withAddress(
        new Address({
          street: 'some street',
        })
      )
      .withContactPeople([
        { contactPersonId: 'id-123', relationship: 'rel' },
        { contactPersonId: 'id-456', relationship: 'rel' },
      ])

    expect(child.primaryContactPerson.contactPersonId).toEqual('id-123')
    expect(child.address.isValid).toBe(false)

    const address = await addressService.getAddressForChild('tenant2', child)

    expect(address).toMatchInlineSnapshot(`
      Address {
        "city": "contact city 1",
        "number": "contact number 1",
        "street": "contact street 1",
        "zipCode": 654,
      }
    `)
  })
})
