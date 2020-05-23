import { gql } from 'apollo-server-express'

export const typeDef = gql`
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
`
