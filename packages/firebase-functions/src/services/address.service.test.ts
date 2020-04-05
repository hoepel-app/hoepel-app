/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from 'chai'
import { AddressService } from './address.service'
import { Address, Child, ContactPerson } from '@hoepel.app/types'
import { IContactPersonRepository } from './contact-person.service'

describe('AddressService#getAddressForChild', () => {
  it('Get address from child when it is valid', async () => {
    const contactPersonRepository: IContactPersonRepository = {
      delete(tenant: string, id: string) {
        throw new Error()
      },
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
      getAll(tenant: string) {
        throw new Error()
      },
      getMany(tenant: string, ids: ReadonlyArray<string>) {
        throw new Error()
      },
    }

    const addressService = new AddressService(contactPersonRepository)

    const child = Child.empty().withAddress(
      new Address({
        city: 'city1',
        street: 'street1',
        number: 'number1',
        zipCode: 12345,
      })
    )

    const address = await addressService.getAddressForChild('tenant1', child)

    expect(address).not.to.be.null
    expect(address?.city).to.equal('city1')
    expect(address?.street).to.equal('street1')
    expect(address?.number).to.equal('number1')
    expect(address?.zipCode).to.equal(12345)
  })

  it('Get address from primary contact person when child has no valid address', async () => {
    const contactPersonRepository: IContactPersonRepository = {
      delete(tenant: string, id: string) {
        throw new Error()
      },
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
      getAll(tenant: string) {
        throw new Error()
      },
      getMany(tenant: string, ids: ReadonlyArray<string>) {
        throw new Error()
      },
    }

    const addressService = new AddressService(contactPersonRepository)

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

    expect(child.primaryContactPerson.contactPersonId).to.equal('id-123')
    expect(child.address.isValid).to.be.false

    const address = await addressService.getAddressForChild('tenant2', child)

    expect(address).to.be.not.null
    expect(address?.city).to.equal('contact city 1')
    expect(address?.street).to.equal('contact street 1')
    expect(address?.number).to.equal('contact number 1')
    expect(address?.zipCode).to.equal(654)
  })
})
