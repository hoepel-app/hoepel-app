import { IResolvers } from 'apollo-server-express'
import { Application } from './application'

export const resolvers: IResolvers = {
  Query: {
    application: () => ({}),
  },
  Application: {
    release: Application.release,
    environment: Application.environment,
  },
}
