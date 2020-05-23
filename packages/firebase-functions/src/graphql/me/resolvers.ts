import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { Me } from './me'
import { AuthorizationService } from '../authorization-service'

export const resolvers: IResolvers = {
  Query: {
    me: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedInHoepelApp(context)
      return Me.me(context.token, context.user)
    },
  },
  User: {
    token: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedInHoepelApp(context)
      return Me.token(context.token)
    },
  },
}
