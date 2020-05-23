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
  }

  type ParentPlatform {
    childrenManagedByMe: [ChildManagedByParent!]!
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
