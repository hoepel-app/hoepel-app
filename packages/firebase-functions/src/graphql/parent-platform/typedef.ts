import { gql } from 'apollo-server-express'

export const typeDef = gql`
  type ChildManagedByParent {
    firstName: String!
    lastName: String!
  }

  type ParentPlatform {
    childrenManagedByMe: [ChildManagedByParent!]!
  }

  extend type Query {
    parentPlatform(organisationId: ID!): ParentPlatform!
  }
`
