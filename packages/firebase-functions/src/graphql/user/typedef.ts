import { gql } from 'apollo-server-express'

export const typeDef = gql`
  type User {
    id: ID!
    uid: ID!
    email: String!
    emailVerified: Boolean!
    creationTime: String!
    lastSignInTime: String!
    disabled: Boolean!
    displayName: String
    photoURL: String
  }

  type UserList {
    list: [User!]!
    pageToken: String
  }

  extend type Query {
    users(pageToken: String): UserList
    user(id: ID!): User
  }
`
