import { IResolvers } from 'graphql-tools'
import { Context } from '../index'
import { Tenant } from './tenant'
import { AuthorizationService } from '../authorization-service'

export const resolvers: IResolvers = {
  Query: {
    tenants: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedIn(context)
      return Tenant.tenants(context.user)
    },
    tenant: async (obj, { id }, context: Context) => {
      AuthorizationService.assertLoggedIn(context)
      return Tenant.tenant(context.user, id)
    },
  },
}
