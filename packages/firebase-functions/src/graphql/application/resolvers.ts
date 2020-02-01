import { IResolvers } from 'graphql-tools'
import { Application } from './application'

export const resolvers: IResolvers = {
  Query: {
    application: () => Application.release(),
  },
}
