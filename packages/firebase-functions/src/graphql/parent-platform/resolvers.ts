import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { ParentPlatform } from './parent-platform'
import { AuthorizationService } from '../authorization-service'
import { DayDate } from '@hoepel.app/types'
import {
  ChildOnRegistrationWaitingList,
  WeekIdentifier,
} from '@hoepel.app/isomorphic-domain'
import { id } from 'typesaurus'
import { ShiftsGroupedByWeek } from './shifts-grouped-by-week'

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

type ChildAttendanceIntentionInput = {
  organisationId: string
  childId: string
  preferredBubbleName?: string
  weekNumber: number
  year: number
  shifts: readonly string[]
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
    shiftsAvailable: async (
      { organisationId }: { organisationId: string },
      { year }: { year: number },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      return ParentPlatform.shiftsAvailable(organisationId, year)
    },
  },
  ShiftsGroupedByWeek: {
    possibleBubbles: async (parent: {
      organisationId: string
      year: number
      weekNumber: number
    }) => {
      return ParentPlatform.findBubbles(
        parent.organisationId,
        parent.year,
        parent.weekNumber
      )
    },
    attendanceIntentionsForChild: async (
      parent: {
        organisationId: string
        year: number
        weekNumber: number
      },
      { childId }: { childId: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      const attendance = await ShiftsGroupedByWeek.attendanceIntentionsForChild(
        parent.organisationId,
        new WeekIdentifier(parent.year, parent.weekNumber),
        childId,
        context.user.uid
      )

      if (attendance == null) {
        return attendance
      } else {
        return {
          ...attendance,
          status: attendance.status.replace(/\-/g, '_'),
        }
      }
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
        tenant: organisationId,
        id: await id(),
      })

      await ParentPlatform.registerChildFromParentPlatform(child)
    },
    registerChildAttendanceIntentionFromParentPlatform: async (
      parent,
      {
        organisationId,
        childId,
        shifts,
        weekNumber,
        year,
        preferredBubbleName,
      }: ChildAttendanceIntentionInput,
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      await ParentPlatform.registerChildAttendanceIntentionFromParentPlatform(
        organisationId,
        context.user.uid,
        {
          childId,
          preferredBubbleName: preferredBubbleName || null,
          shifts,
          week: new WeekIdentifier(year, weekNumber),
        }
      )
    },
    unregisterPendingChildAttendanceIntentionFromParentPlatform: async (
      parent,
      args: {
        organisationId: string
        childId: string
        weekNumber: number
        year: number
      },
      context: Context
    ) => {
      AuthorizationService.assertLoggedInParentPlatform(context)

      await ParentPlatform.unregisterPendingChildAttendanceIntentionFromParentPlatform(
        args.organisationId,
        context.user.uid,
        args.childId,
        new WeekIdentifier(args.year, args.weekNumber)
      )
    },
  },
}
