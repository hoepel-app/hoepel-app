import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { ParentPlatform } from './parent-platform'
import { AuthorizationService } from '../authorization-service'
import { DayDate, Child } from '@hoepel.app/types'

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
    birthDate: DayDate
    remarks: string
    uitpasNumber?: string
  }
}

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
  Mutation: {
    registerChildFromParentPlatform: async (
      obj,
      { newChild, organisationId }: RegisterChildInput,
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      const gender =
        newChild.gender === 'male' ||
        newChild.gender === 'female' ||
        newChild.gender === 'other'
          ? newChild.gender
          : undefined

      const child = new Child({
        address: newChild.address,
        firstName: newChild.firstName,
        lastName: newChild.lastName,
        contactPeople: [],
        email: newChild.email,
        phone: newChild.phone,
        remarks: newChild.remarks,
        birthDate: newChild.birthDate,
        gender,
        managedByParents: [context.user.uid],
        uitpasNumber: newChild.uitpasNumber,
      })

      await ParentPlatform.registerChildFromParentPlatform(
        organisationId,
        child
      )
    },
  },
}
