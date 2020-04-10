import { IResolvers } from 'graphql-tools'
import { Context } from '../index'
import { Tenant } from './tenant'

export const resolvers: IResolvers = {
  Query: {
    tenants: async (obj, args, context: Context) => {
      return Tenant.tenants(context.user ?? null)
    },
    tenant: async (obj, { id }, context: Context) => {
      return Tenant.tenant(context.user ?? null, id)
    },
  },
}
