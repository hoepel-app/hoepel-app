import { IResolvers } from 'graphql-tools'
import { Context } from '../index'
import { Tenant } from './tenant'

export const resolvers: IResolvers = {
  Query: {
    tenants: async (obj, args, { user }: Context) => Tenant.tenants(user),
    tenant: async (obj, { id }, { user }: Context) => Tenant.tenant(user, id),
  },
}
