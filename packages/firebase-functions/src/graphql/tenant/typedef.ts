import { gql } from 'apollo-server-express'

export const typeDef = gql`
  input RequestOrganisationInput {
    test: String!
  }

  type TenantAddress {
    streetAndNumber: String
    zipCode: Int
    city: String
  }

  type TenantContactPerson {
    name: String
    phone: String
    email: String
  }

  type Tenant {
    id: ID!
    name: String

    address: TenantAddress
    description: String
    contactPerson: TenantContactPerson
    email: String
    logoUrl: String
    logoSmallUrl: String
    privacyPolicyUrl: String

    enableOnlineRegistration: Boolean!
    enableOnlineEnrollment: Boolean!
  }

  extend type Query {
    tenants: [Tenant!]!
    tenant(id: ID!): Tenant
  }

  extend type Mutation {
    requestOrganisation(input: RequestOrganisationInput!): Void

    unassignMemberFromOrganisation(
      organisationId: ID!
      uidToUnassign: ID!
    ): Void

    assignMemberToOrganisation(organisationId: ID!, uidToAssign: ID!): Void
  }
`
