import { IResolvers } from 'graphql-tools'
import { Context } from '../index'
import * as admin from 'firebase-admin'
import {
  createCrewAttendanceByCrewRepository,
  createCrewAttendanceByShiftRepository,
  CrewAttendanceService,
} from '../../services/crew-attendance.service'
import { UserService } from '../../services/user.service'
import { createChildRepository } from '../../services/child.service'
import { createCrewRepository } from '../../services/crew.service'
import { createContactPersonRepository } from '../../services/contact-person.service'
import {
  ShiftService,
  createShiftRepository,
} from '../../services/shift.service'
import {
  ChildAttendanceService,
  createChildAttendanceByChildRepository,
  createChildAttendanceByShiftRepository,
} from '../../services/child-attendance.service'
import { AddressDomainService } from '@hoepel.app/domain'
import { XlsxExporter } from '@hoepel.app/export-xlsx'
import { OrganisationService } from '../../services/organisation.service'
import { FileService } from '../../services/file.service'
import { TemplateService } from '../../services/template.service'
import { assertHasPermission } from '../assert-has-permission'
import { Permission, DayDate } from '@hoepel.app/types'
import { AuthorizationService } from '../authorization-service'

const db = admin.firestore()
const auth = admin.auth()

const templatesStorage = admin.storage().bucket('hoepel-app-templates')
const reportsStorage = admin.storage().bucket('hoepel-app-reports')

const userService = new UserService(db, auth)
const childRepository = createChildRepository(db)
const crewRepository = createCrewRepository(db)
const contactPersonRepository = createContactPersonRepository(db)
const shiftRepository = createShiftRepository(db)
const childAttendanceByChildRepository = createChildAttendanceByChildRepository(
  db
)
const childAttendanceByShiftRepository = createChildAttendanceByShiftRepository(
  db
)
const crewAttendanceByCrewRepository = createCrewAttendanceByCrewRepository(db)
const crewAttendanceByShiftRepository = createCrewAttendanceByShiftRepository(
  db
)

const addressService = new AddressDomainService(contactPersonRepository)
const organisationService = new OrganisationService(db, auth)
const shiftService = new ShiftService(shiftRepository)
const childAttendanceService = new ChildAttendanceService(
  childAttendanceByChildRepository,
  childAttendanceByShiftRepository
)
const crewAttendanceService = new CrewAttendanceService(
  crewAttendanceByCrewRepository,
  crewAttendanceByShiftRepository
)
const fileService = new FileService(
  new XlsxExporter(),
  childRepository,
  crewRepository,
  contactPersonRepository,
  shiftService,
  childAttendanceService,
  crewAttendanceService,
  db,
  reportsStorage
)
const templateService = new TemplateService(
  db,
  templatesStorage,
  reportsStorage,
  childRepository,
  contactPersonRepository,
  addressService,
  organisationService,
  childAttendanceService,
  shiftRepository
)

export const resolvers: IResolvers = {
  Mutation: {
    acceptPrivacyPolicy: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedIn(context)
      await userService.acceptPrivacyPolicy(context.token.uid)
    },
    acceptTermsAndConditions: async (obj, args, context: Context) => {
      AuthorizationService.assertLoggedIn(context)
      await userService.acceptTermsAndConditions(context.token.uid)
    },
    changeDisplayName: async (
      obj,
      { name }: { name: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await userService.updateDisplayName(context.token.uid, name)
    },
    deleteReport: async (
      obj,
      { tenant, fileName }: { tenant: string; fileName: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        tenant,
        Permission.ReportsDelete
      )
      await fileService.removeFile(tenant, context.token.uid, fileName)
    },
    createReport: async (
      obj,
      {
        tenant,
        type,
        format,
        year,
      }: { tenant: string; type: string; format: string; year?: number },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        tenant,
        Permission.ReportsRequest
      )

      const createdBy = context.user.displayName || context.user.email || ''
      const reportYear = year || new Date().getFullYear()

      if (format !== 'XLSX') {
        throw new Error('Only XLSX is supported as format')
      }

      switch (type) {
        case 'all-children':
          return await fileService.exportAllChildren(
            tenant,
            createdBy,
            context.token.uid
          )
        case 'all-crew':
          return await fileService.exportAllCrew(
            tenant,
            createdBy,
            context.token.uid
          )
        case 'children-with-comment':
          return await fileService.exportChildrenWithComment(
            tenant,
            createdBy,
            context.token.uid
          )
        case 'crew-attendances':
          return await fileService.exportCrewAttendances(
            tenant,
            createdBy,
            context.token.uid,
            reportYear
          )
        case 'child-attendances':
          return await fileService.exportChildAttendances(
            tenant,
            createdBy,
            context.token.uid,
            reportYear
          )
        case 'fiscal-certificates-list':
          return await fileService.exportFiscalCertificatesList(
            tenant,
            createdBy,
            context.token.uid,
            reportYear
          )
        case 'children-per-day':
          return await fileService.exportChildrenPerDay(
            tenant,
            createdBy,
            context.token.uid,
            reportYear
          )
        case 'day-overview':
          throw new Error(
            'Use createDayOverviewReport to create day overview reports'
          )
        default:
          throw new Error(`No exporter found for ${type}`)
      }
    },
    createDayOverviewReport: async (
      obj,
      {
        tenant,
        format,
        dayId,
      }: { tenant: string; format: string; dayId: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        tenant,
        Permission.ReportsRequest
      )

      const day = DayDate.fromDayId(dayId)

      const createdBy = context.user.displayName || context.user.email || ''

      if (format !== 'XLSX') {
        throw new Error('Only XLSX is supported as format')
      }

      return await fileService.exportDayOverview(
        tenant,
        createdBy,
        context.token.uid,
        day
      )
    },
    testTemplate: async (
      obj,
      args: { tenant: string; templateFileName: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        args.tenant,
        Permission.TemplateRead
      )

      return await templateService.testTemplate(
        args.tenant,
        args.templateFileName,
        context.user.displayName || context.user.email,
        context.token.uid
      )
    },
    fillInTemplate: async (
      obj,
      args: {
        tenant: string
        childId: string
        templateFileName: string
        year?: number
      },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        args.tenant,
        Permission.TemplateFillIn
      )
      await assertHasPermission(
        context.token.uid,
        args.tenant,
        Permission.ChildRead
      )

      return await templateService.fillInChildTemplate(args.tenant, {
        createdBy: context.user.displayName || context.token.email || '',
        createdByUid: context.token.uid,
        childId: args.childId,
        templateFileName: args.templateFileName,
        year: args.year || new Date().getFullYear(),
      })
    },
    deleteTemplate: async (
      obj,
      args: { tenant: string; templateFileName: string },
      context: Context
    ) => {
      AuthorizationService.assertLoggedIn(context)
      await assertHasPermission(
        context.token.uid,
        args.tenant,
        Permission.TemplateWrite
      )

      const result = await templateService.deleteTemplate(
        args.tenant,
        args.templateFileName
      )

      return {
        ...result,
        created: result.created.getTime().toString(),
      }
    },
    throwTestException: () => {
      throw new Error('Test exception requested by user through mutation')
    },
  },
}
