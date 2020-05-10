import { gql } from 'apollo-server-express'

export const typeDef = gql`
  type UserToken {
    picture: String
    isAdmin: Boolean!
    tenants: [String!]!
    iss: String!
    aud: String!
    authTime: String!
    sub: String!
    uid: String!
    iat: Int!
    exp: Int!
    email: String
    emailVerified: Boolean
  }

  type User {
    id: ID!
    token: UserToken
    displayName: String
    acceptedPrivacyPolicy: String
    acceptedTermsAndConditions: String
    email: String!
  }

  extend type Query {
    me: User
  }
`
