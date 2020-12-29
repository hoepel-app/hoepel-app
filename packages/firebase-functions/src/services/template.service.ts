import * as admin from 'firebase-admin'
import { IChildRepository } from './child.service'
import { OrganisationService } from './organisation.service'
import { ChildAttendanceService } from './child-attendance.service'
import { DayDate, FileType, Price, IReport, ITemplate } from '@hoepel.app/types'
import _ from 'lodash'
import dropTenant from '../util/drop-tenant'
import { IContactPersonRepository } from './contact-person.service'
import { AddressDomainService } from '@hoepel.app/domain'
import {
  exampleData,
  CertificateTemplateFillInData,
  fillIn,
} from '@hoepel.app/export-docx'
import { Bucket } from './bucket-type'
import { ShiftRepository } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'

interface CertificateTemplateFillInOptions {
  /**
   * Name of the template to use. This is the file name of the template in the templates bucket
   */
  readonly templateFileName: string

  readonly childId: string

  /**
   * Only get data for this year
   */
  readonly year: number

  /**
   * Name or email address of the requesting user
   */
  readonly createdBy: string

  /**
   * Id of the requesting user
   */
  readonly createdByUid: string
}

/**
 * Metadata for templates stored in Firestore
 */
interface TemplateMetadata {
  created: Date
  createdBy: string
  displayName: string
  fileName: string
  type: FileType
}

export class TemplateService {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly templatesStorage: Bucket,
    private readonly reportsStorage: Bucket,
    private readonly childRepository: IChildRepository,
    private readonly contactPersonRepository: IContactPersonRepository,
    private readonly addressService: AddressDomainService,
    private readonly organisationService: OrganisationService,
    private readonly childAttendanceService: ChildAttendanceService,
    private readonly shiftRepository: ShiftRepository
  ) {}

  /**
   * @param tenant Name of the tenant
   * @param templateFileName The file name of the template to test
   * @param createdBy Name or email address of the person who requested to test this template
   * @param createdByUid User id of the person who requested to test this template
   */
  async testTemplate(
    tenant: string,
    templateFileName: string,
    createdBy: string,
    createdByUid: string
  ): Promise<{ path: string }> {
    const filledIn = await this.getAndFillTemplate(
      tenant,
      templateFileName,
      exampleData
    )

    const fileName = Math.random().toString(36).substring(2)

    await this.templatesStorage
      .file('test-template/' + fileName)
      .save(filledIn, {
        metadata: {
          contentDisposition: `inline; filename="voorbeeld template.docx"`,
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          metadata: {
            tenant: tenant,
            created: new Date().getTime().toString(),
            createdBy,
            createdByUid,
          },
        },
      })

    return { path: 'test-template/' + fileName }
  }

  async fillInChildTemplate(
    tenant: string,
    options: CertificateTemplateFillInOptions
  ): Promise<
    IReport & {
      id: string
      tenant: string
      childId: string
      year: number
      fillInParameters: CertificateTemplateFillInData
    }
  > {
    const docToSaveRef = this.db.collection('reports').doc()
    const reportId = docToSaveRef.id
    const data = await this.getChildData(
      tenant,
      options.childId,
      options.year,
      reportId
    )
    const childName = data.kind_naam
    const filledIn = await this.getAndFillTemplate(
      tenant,
      options.templateFileName,
      data
    )
    const expires = this.getExpirationDate(new Date())

    const fileMetadata = await this.getFileMetadata(
      tenant,
      options.templateFileName
    )

    if (fileMetadata == null) {
      throw new Error(
        `Could not get file metadata for ${options.templateFileName} (tenant: ${tenant})`
      )
    }

    const reportType = fileMetadata.type
    const fileNamePrefix = this.getFileNamePrefix(reportType)

    const fileName = `${new Date()
      .getTime()
      .toString()} ${tenant} ${fileNamePrefix} ${childName} ${
      options.year
    }.docx`

    // Upload file to storage
    await this.reportsStorage.file(fileName).save(filledIn, {
      metadata: {
        contentDisposition: `inline; filename="${fileNamePrefix} ${childName} ${options.year}.docx"`,
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          tenant,
          expires: expires.getTime().toString(),
        },
      },
    })

    // Save to Firestore
    const docToSave: IReport & {
      tenant: string
      childId: string
      year: number
      fillInParameters: CertificateTemplateFillInData
    } = {
      expires,
      created: new Date(),
      createdBy: options.createdBy,
      createdByUid: options.createdByUid,
      description: `${fileNamePrefix} ${childName} (${options.year})`,
      format: 'DOCX',
      refPath: fileName,
      tenant,
      type: reportType,
      childId: options.childId,
      year: options.year,
      fillInParameters: data,
    }

    await docToSaveRef.set(docToSave)

    return { ...docToSave, id: docToSaveRef.id }
  }

  async deleteTemplate(
    tenant: string,
    templateFileName: string
  ): Promise<ITemplate> {
    const docs = await this.db
      .collection('templates')
      .where('fileName', '==', templateFileName)
      .where('tenant', '==', tenant)
      .get()

    if (docs.empty) {
      throw new Error(
        `Could not find template to delete for tenant ${tenant} with fileName ${templateFileName}`
      )
    }

    const data = docs.docs[0].data()
    if (data.tenant !== tenant) {
      throw new Error(
        `Tried to delete ${templateFileName} but it does not belong to tenant ${tenant}`
      )
    }

    await this.db.collection('templates').doc(docs.docs[0].id).delete()
    await this.templatesStorage.file(tenant + '/' + templateFileName).delete()

    return { ...data, created: data.created.toDate() } as ITemplate
  }

  private async getFileMetadata(
    tenant: string,
    templateFileName: string
  ): Promise<(TemplateMetadata & { id: string }) | null> {
    const snapshot = await this.db
      .collection('templates')
      .where('fileName', '==', templateFileName)
      .where('tenant', '==', tenant)
      .get()

    if (snapshot.empty) {
      throw new Error(
        `Metadata in Firestore not found for ${templateFileName} for tenant ${tenant}`
      )
    }

    const doc = snapshot.docs[0]
    return dropTenant({
      id: doc.id,
      ...(doc.data() as TemplateMetadata & { tenant: string }),
    })
  }

  /**
   * Create a file name prefix depending of the report type. This prefix will be joined with child's name
   */
  private getFileNamePrefix(reportType: FileType): string {
    switch (reportType) {
      case 'child-fiscal-certificate':
        return 'Fiscaal attest voor'
      case 'child-health-insurance-certificate':
        return 'Attest mutualiteit voor'
      default:
        return 'Attest voor'
    }
  }

  /**
   * Get a file from remote storage, load it, and fill in with the given data
   */
  private async getAndFillTemplate(
    tenant: string,
    templateFileName: string,
    data: CertificateTemplateFillInData
  ): Promise<Buffer> {
    const template = await this.getTemplate(tenant, templateFileName)
    return fillIn(template, data)
  }

  /**
   * Get a template by name from storage
   */
  private async getTemplate(
    tenant: string,
    templateFileName: string
  ): Promise<Buffer> {
    const templateFile = this.templatesStorage.file(
      tenant + '/' + templateFileName
    )
    const templateExists = await templateFile.exists()

    if (!templateExists || !templateExists[0]) {
      throw new Error(`Template does not exist: ${templateFileName}`)
    }

    return (await templateFile.download())[0]
  }

  private getExpirationDate(creationDate: Date): Date {
    const expires = new Date(creationDate)
    expires.setFullYear(expires.getFullYear() + 1) // Document expires in a year from now
    return expires
  }

  private async getChildData(
    tenant: string,
    childId: string,
    year: number,
    reportId: string
  ): Promise<CertificateTemplateFillInData> {
    const child = await this.childRepository.get(tenant, childId)
    const primaryContactPerson = child.primaryContactPerson
      ? await this.contactPersonRepository.get(
          tenant,
          child.primaryContactPerson.contactPersonId
        )
      : null

    const address = await this.addressService.getAddressForChild(tenant, child)
    const organisation = await this.organisationService.getDetails(tenant)

    const allAttendances = await this.childAttendanceService.getAttendancesForChild(
      tenant,
      childId
    )
    const allShiftIds = Object.keys(allAttendances)
    const shifts = (
      await this.shiftRepository
        .findMany(tenant, allShiftIds)
        .pipe(first())
        .toPromise()
    ).filter((shift) => shift.date.year === year)

    const numberOfUniqueDays = new Set(shifts.map((shift) => shift.date.id))
      .size

    const totalPricePaid = _.toPairs(allAttendances)
      .filter(([shiftId]) => shifts.map((s) => s.id).includes(shiftId)) // Only keep attendances in this year
      .map((att) => att[1].amountPaid)
      .map((iprice) => new Price(iprice))
      .reduce((x, y) => x.add(y), new Price({ cents: 0, euro: 0 }))

    const pricePerShift = shifts
      .map((shift) => {
        const day = DayDate.fromDayId(shift.dayId).toString()
        const attendanceForShift = _.toPairs(allAttendances).find(
          ([shiftId]) => shiftId === shift.id
        )

        const price =
          attendanceForShift == null
            ? Price.zero
            : new Price(attendanceForShift[1].amountPaid)

        return `${day.toString()} (${shift.kind}): ${price.toString()}`
      })
      .join('\n')

    const specificDates = shifts
      .map(
        (shift) =>
          DayDate.fromDayId(shift.dayId).toString() + ' (' + shift.kind + ')'
      )
      .join('\n')

    const organisationAddress =
      (organisation?.address.street || '') +
      ' ' +
      (organisation?.address.number || '') +
      ', ' +
      (organisation?.address.zipCode || '') +
      ' ' +
      (organisation?.address.city || '')

    return {
      kind_naam: child.fullName,
      kind_adres: AddressDomainService.formatAddress(address),
      kind_telefoon: child.phone[0] ? child.phone[0].phoneNumber || '' : '',
      kind_geboortedatum: child.birthDate
        ? child.birthDate.toDDMMYYYY('/')
        : '(geen geboortedatum opgegeven)',

      contactpersoon_naam: primaryContactPerson
        ? primaryContactPerson.fullName
        : '(geen contactpersoon toegevoegd)',

      organisator_naam: organisation?.name || '',
      organisator_adres: organisationAddress,
      organisator_email: organisation?.email || '',
      organisator_telefoon: organisation?.contactPerson.phone || '',
      organisator_verantwoordelijke: organisation?.contactPerson.name || '',

      jaar: year.toString(),
      concrete_data: specificDates,
      aantal_dagen: `${numberOfUniqueDays} (${shifts.length} dagdelen/activiteiten)`,
      prijs_per_dag: pricePerShift,
      totale_prijs: totalPricePaid.toString(),

      attest_id: reportId,
      aanmaakdatum: DayDate.today().toString(),
    }
  }
}
