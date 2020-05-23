import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { Tenant } from './tenant'
import { Tenant as TenantType } from '@hoepel.app/types'

export const resolvers: IResolvers = {
  Query: {
    tenants: async (obj, args, context: Context) => {
      return Tenant.tenants(context.user ?? null)
    },
    tenant: async (obj, { id }, context: Context) => {
      return Tenant.tenant(context.user ?? null, id)
    },
  },
  Tenant: {
    // TODO these can be undefined... Remove when tenant has a nice application service
    enableOnlineEnrollment: (obj: TenantType) => {
      return obj.enableOnlineEnrollment === true
    },
    enableOnlineRegistration: (obj: TenantType) => {
      return obj.enableOnlineRegistration === true
    },
  },
}
