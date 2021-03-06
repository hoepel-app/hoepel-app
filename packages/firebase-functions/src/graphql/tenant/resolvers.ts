import * as admin from 'firebase-admin'
import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { Tenant } from './tenant'
import { Tenant as TenantType } from '@hoepel.app/types'
import { OrganisationService } from '../../services/organisation.service'
import { AuthorizationService } from '../authorization-service'
import { UserService } from '../../services/user.service'

const db = admin.firestore()
const auth = admin.auth()
const organisationService = new OrganisationService(db, auth)
const userService = new UserService(db, auth)

export const resolvers: IResolvers = {
  Query: {
    tenants: async (obj, args, context: Context) => {
      const user = context?.domain == 'hoepel.app' ? context : null
      return Tenant.tenants(user)
    },
    tenant: async (obj, { id }, context: Context) => {
      const user = context?.domain == 'hoepel.app' ? context : null
      return Tenant.tenant(user, id)
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
    members: async (obj: TenantType & { id: string }) => {
      const currentMembers = await organisationService.listMembers(obj.id)

      return currentMembers.map((member) => {
        return {
          permissions: member.permissions,
          email: member.user.email,
          displayName: member.user.displayName,
          uid: member.user.uid,
        }
      })
    },
    possibleMembers: async (obj: TenantType & { id: string }) => {
      return organisationService.listPossibleMembers(obj.id)
    },
  },
  Mutation: {
    requestOrganisation: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedInHoepelApp(context)
    },
    unassignMemberFromOrganisation: async (
      obj,
      args: { organisationId: string; uidToUnassign: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInHoepelApp(context)
      await userService.assertUserManagesOrganisation(
        context.token.uid,
        args.organisationId
      )

      await organisationService.unassignMemberFromOrganisation(
        args.organisationId,
        args.uidToUnassign
      )
    },
    assignMemberToOrganisation: async (
      obj,
      args: { organisationId: string; uidToAssign: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInHoepelApp(context)
      await userService.assertUserManagesOrganisation(
        context.token.uid,
        args.organisationId
      )

      await organisationService.assignMemberToOrganisation(
        args.organisationId,
        args.uidToAssign
      )
    },
    assignSelfToOrganisation: async (
      obj,
      args: { organisationId: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInAdmin(context)

      await organisationService.assignMemberToOrganisation(
        args.organisationId,
        context.token.uid
      )
    },
  },
}
