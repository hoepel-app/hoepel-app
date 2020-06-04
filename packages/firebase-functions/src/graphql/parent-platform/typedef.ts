import { gql } from 'apollo-server-express'

export const typeDef = gql`
  input ChildManagedByParentAddressInput {
    street: String
    number: String
    zipCode: Int
    city: String
  }

  input ChildManagedByParentPhoneContactInput {
    phoneNumber: String!
    comment: String
  }

  input ChildManagedByParentInput {
    firstName: String!
    lastName: String!
    address: ChildManagedByParentAddressInput!
    phone: [ChildManagedByParentPhoneContactInput!]!
    email: [String!]!
    gender: String
    birthDate: DayDate
    remarks: String!
    uitpasNumber: String
  }

  type ChildManagedByParent {
    id: String!
    firstName: String!
    lastName: String!
    onRegistrationWaitingList: Boolean!
  }

  type ShiftChildCanAttend {
    id: ID!
    description: String!
    location: String!
    start: DateTime!
    end: DateTime!
    kind: String!
    price: String!
  }

  type DayWithShiftsChildrenCanAttend {
    day: DayDate!
    shifts: [ShiftChildCanAttend!]!
  }

  type ShiftsGroupedByWeek {
    weekNumber: Int!
    days: [DayWithShiftsChildrenCanAttend!]!
  }

  type ParentPlatform {
    childrenManagedByMe: [ChildManagedByParent!]!
    shiftsAvailable(year: Int!): [ShiftsGroupedByWeek!]!
  }

  extend type Query {
    parentPlatform(organisationId: ID!): ParentPlatform!
  }

  extend type Mutation {
    registerChildFromParentPlatform(
      organisationId: ID!
      newChild: ChildManagedByParentInput
    ): String
  }
`
