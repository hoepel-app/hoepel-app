import { gql } from 'apollo-server-express'

export const typeDef = gql`
  type Application {
    release: String!
  }

  extend type Query {
    application: Application
  }
`
