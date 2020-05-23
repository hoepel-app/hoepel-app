import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { ParentPlatform } from './parent-platform'
import { AuthorizationService } from '../authorization-service'

export const resolvers: IResolvers = {
  Query: {
    parentPlatform: async (
      obj,
      { organisationId }: { organisationId: string },
      context: Context
    ) => {
      return { organisationId }
    },
  },
  ParentPlatform: {
    childrenManagedByMe: async (
      { organisationId }: { organisationId: string },
      args,
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      return ParentPlatform.childrenManagedByMe(
        context.user.uid,
        organisationId
      )
    },
  },
}
