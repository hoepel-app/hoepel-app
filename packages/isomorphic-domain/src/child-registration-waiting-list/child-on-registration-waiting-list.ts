import { Aggregate } from '@hoepel.app/ddd-library'
import { DayDate, Child, Address, IPhoneContact } from '@hoepel.app/types'

export type ChildOnRegistrationWaitingListProps = {
  id: string
  tenant: string
  newChild: {
    firstName: string
    lastName: string
    address: {
      street?: string
      number?: string
      zipCode?: number
      city?: string
    }
    phone: readonly {
      phoneNumber: string
      comment?: string
    }[]
    email: readonly string[]
    gender?: string
    birthDate?: string
    remarks: string
    uitpasNumber?: string
    createdByParentUid: string
  }
}

export class ChildOnRegistrationWaitingList implements Aggregate {
  private constructor(
    private readonly props: ChildOnRegistrationWaitingListProps
  ) {}

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenant
  }

  get firstName(): string {
    return this.props.newChild.firstName
  }

  get lastName(): string {
    return this.props.newChild.lastName
  }

  get birthDate(): DayDate | null {
    if (this.props.newChild.birthDate == null) {
      return null
    }

    return DayDate.fromISO8601(this.props.newChild.birthDate)
  }

  get gender(): 'male' | 'female' | 'other' | null {
    switch (this.props.newChild.gender) {
      case 'male':
      case 'female':
      case 'other':
        return this.props.newChild.gender

      default:
        return null
    }
  }

  get remarks(): string {
    return this.props.newChild.remarks
  }

  get createdByParentUid(): string {
    return this.props.newChild.createdByParentUid
  }

  get address(): Address {
    return new Address(this.props.newChild.address)
  }

  get email(): readonly string[] {
    return this.props.newChild.email
  }

  get phoneContacts(): readonly IPhoneContact[] {
    return this.props.newChild.phone
  }

  get uitpasNumber(): string | null {
    return this.props.newChild.uitpasNumber || null
  }

  toProps(): ChildOnRegistrationWaitingListProps {
    return this.props
  }

  static fromProps(
    props: ChildOnRegistrationWaitingListProps
  ): ChildOnRegistrationWaitingList {
    return new ChildOnRegistrationWaitingList(props)
  }

  static create(
    props: ChildOnRegistrationWaitingListProps
  ): ChildOnRegistrationWaitingList {
    return ChildOnRegistrationWaitingList.fromProps(props)
  }

  makeChild(newChildId?: string): Child {
    return new Child({
      id: newChildId,
      address: this.address,
      firstName: this.firstName,
      lastName: this.lastName,
      contactPeople: [],
      email: this.email,
      phone: this.phoneContacts,
      remarks: this.remarks,
      birthDate: this.birthDate || undefined,
      gender: this.gender || undefined,
      managedByParents: [this.createdByParentUid],
      uitpasNumber: this.uitpasNumber || undefined,
    })
  }

  mergeWithExistingChild(existingChild: Child): Child {
    const remarks =
      existingChild.remarks === ''
        ? this.remarks
        : `${this.remarks}\n\nToegevoegd door speelplein: ${existingChild.remarks}`

    const mergedChild = existingChild
      .withAddress(this.address)
      .withFirstName(this.firstName)
      .withLastName(this.lastName)
      .withEmail(this.email)
      .withPhoneContact(this.phoneContacts)
      .withManagedByParents([
        ...(existingChild.managedByParents || []),
        this.createdByParentUid,
      ])
      .withRemarks(remarks)
      .withUitpasNumber(this.uitpasNumber || undefined)

    if (this.birthDate == null) {
      return mergedChild
    }

    return mergedChild.withBirthDate(this.birthDate)
  }
}
