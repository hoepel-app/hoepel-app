import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { ParentPlatform } from './parent-platform'
import { AuthorizationService } from '../authorization-service'
import { DayDate } from '@hoepel.app/types'
import { ChildOnRegistrationWaitingList } from '@hoepel.app/isomorphic-domain'
import { id } from 'typesaurus'

type RegisterChildInput = {
  organisationId: string
  newChild: {
    firstName: string
    lastName: string
    address: {
      street?: string
      number?: string
      zipCode?: number
      city?: string
    }
    phone: readonly {
      phoneNumber: string
      comment?: string
    }[]
    email: readonly string[]
    gender?: string
    birthDate?: DayDate
    remarks: string
    uitpasNumber?: string
  }
}

export const resolvers: IResolvers = {
  Query: {
    parentPlatform: async (
      obj,
      { organisationId }: { organisationId: string }
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
  Mutation: {
    registerChildFromParentPlatform: async (
      obj,
      { newChild, organisationId }: RegisterChildInput,
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      const child = ChildOnRegistrationWaitingList.create({
        newChild: {
          ...newChild,
          birthDate: newChild.birthDate?.toISO8601(),
          createdByParentUid: context.user.uid,
        },
        tenantId: organisationId,
        id: await id(),
      })

      await ParentPlatform.registerChildFromParentPlatform(child)
    },
  },
}
