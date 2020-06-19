import { FileType, IReport, DayDate } from '@hoepel.app/types'
import * as admin from 'firebase-admin'
import { IChildRepository } from './child.service'
import { ICrewRepository } from './crew.service'
import { IContactPersonRepository } from './contact-person.service'
import { ChildAttendanceService } from './child-attendance.service'
import { CrewAttendanceService } from './crew-attendance.service'
import {
  buildExcelFile,
  SpreadsheetData,
  XlsxExporter,
  LocalFile,
} from '@hoepel.app/export-xlsx'
import { Bucket } from './bucket-type'
import { ShiftRepository } from '@hoepel.app/isomorphic-domain'
import { first } from 'rxjs/operators'
import { ParentPlatformAuthService } from './parent-platform-auth.service'

type FirestoreFileDocument = IReport & { id?: string; tenant: string }

export class FileService {
  constructor(
    private readonly xlsxExporter: XlsxExporter,
    private readonly childRepository: IChildRepository,
    private readonly crewRepository: ICrewRepository,
    private readonly contactPersonRepository: IContactPersonRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly parentPlatformAuthService: ParentPlatformAuthService,
    private readonly childAttendanceService: ChildAttendanceService,
    private readonly crewAttendanceService: CrewAttendanceService,
    private readonly db: admin.firestore.Firestore, // TODO refactor so this service does not use db directly
    private readonly storage: Bucket
  ) {}

  async exportAllChildren(
    tenant: string,
    createdBy: string,
    uid: string
  ): Promise<FirestoreFileDocument> {
    const children = await this.childRepository.getAll(tenant)

    const childrenWithParent = await Promise.all(
      children.map(async (child) => {
        if (
          child.managedByParents == null ||
          child.managedByParents.length === 0
        ) {
          return { child, parent: null }
        }

        return {
          child,
          parent: await this.parentPlatformAuthService.getDetailsForParent(
            child.managedByParents[0]
          ),
        }
      })
    )

    const spreadsheet = this.xlsxExporter.createChildList(childrenWithParent)
    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'all-children'
    )
  }

  async exportAllCrew(
    tenant: string,
    createdBy: string,
    uid: string
  ): Promise<FirestoreFileDocument> {
    const spreadsheet = this.xlsxExporter.createCrewMemberList(
      await this.crewRepository.getAll(tenant)
    )
    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'all-crew'
    )
  }

  async exportChildrenWithComment(
    tenant: string,
    createdBy: string,
    uid: string
  ): Promise<FirestoreFileDocument> {
    const children = (await this.childRepository.getAll(tenant)).filter(
      (child) => child.remarks !== null && child.remarks !== ''
    )

    const childrenWithParent = await Promise.all(
      children.map(async (child) => {
        if (
          child.managedByParents == null ||
          child.managedByParents.length === 0
        ) {
          return { child, parent: null }
        }

        return {
          child,
          parent: await this.parentPlatformAuthService.getDetailsForParent(
            child.managedByParents[0]
          ),
        }
      })
    )

    const spreadsheet = this.xlsxExporter.createChildrenWithCommentList(
      childrenWithParent
    )
    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'children-with-comment'
    )
  }

  async exportCrewAttendances(
    tenant: string,
    createdBy: string,
    uid: string,
    year: number
  ): Promise<FirestoreFileDocument> {
    const allCrewForAtt = (await this.crewRepository.getAll(tenant)).filter(
      (crew) => crew.active
    )

    const shiftsForCrewAtt = await this.shiftRepository
      .findInYear(tenant, year)
      .pipe(first())
      .toPromise()

    const crewAttendances = await this.crewAttendanceService.getCrewAttendancesOnShifts(
      tenant,
      shiftsForCrewAtt
    )

    const spreadsheet = this.xlsxExporter.createCrewMembersAttendanceList(
      allCrewForAtt,
      shiftsForCrewAtt,
      crewAttendances,
      year
    )
    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'crew-attendances'
    )
  }

  async exportChildAttendances(
    tenant: string,
    createdBy: string,
    uid: string,
    year: number
  ): Promise<FirestoreFileDocument> {
    const allChildrenForChildAtt = await this.childRepository.getAll(tenant)

    const shiftsForChildAtt = await this.shiftRepository
      .findInYear(tenant, year)
      .pipe(first())
      .toPromise()

    const childAttendancesForChildAtt = await this.childAttendanceService.getChildAttendancesOnShifts(
      tenant,
      shiftsForChildAtt
    )

    const spreadsheet = this.xlsxExporter.createChildAttendanceList(
      allChildrenForChildAtt,
      shiftsForChildAtt,
      childAttendancesForChildAtt,
      year
    )
    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'child-attendances'
    )
  }

  async exportDayOverview(
    tenant: string,
    createdBy: string,
    uid: string,
    day: DayDate
  ): Promise<FirestoreFileDocument> {
    const allChildren = await this.childRepository.getAll(tenant)
    const shifts = await this.shiftRepository
      .findOnDay(tenant, day)
      .pipe(first())
      .toPromise()

    const childAttendances = await this.childAttendanceService.getChildAttendancesOnShifts(
      tenant,
      shifts
    )

    const spreadsheet = this.xlsxExporter.createDayOverview(
      allChildren,
      shifts,
      childAttendances,
      day
    )

    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'day-overview'
    )
  }

  async exportFiscalCertificatesList(
    tenant: string,
    createdBy: string,
    uid: string,
    year: number
  ): Promise<FirestoreFileDocument> {
    const allChildrenForFiscalCerts = await this.childRepository.getAll(tenant)
    const allContactsForFiscalCerts = await this.contactPersonRepository.getAll(
      tenant
    )

    const shiftsForFiscalCerts = await this.shiftRepository
      .findInYear(tenant, year)
      .pipe(first())
      .toPromise()

    const childAttendancesForFiscalCerts = await this.childAttendanceService.getChildAttendancesOnShifts(
      tenant,
      shiftsForFiscalCerts
    )

    const spreadsheet = this.xlsxExporter.createAllFiscalCertificates(
      allChildrenForFiscalCerts,
      allContactsForFiscalCerts,
      shiftsForFiscalCerts,
      childAttendancesForFiscalCerts,
      year
    )

    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'crew-attendances'
    )
  }

  async exportChildrenPerDay(
    tenant: string,
    createdBy: string,
    uid: string,
    year: number
  ): Promise<FirestoreFileDocument> {
    const shifts = await this.shiftRepository
      .findInYear(tenant, year)
      .pipe(first())
      .toPromise()

    const childAttendances = await this.childAttendanceService.getChildAttendancesOnShifts(
      tenant,
      shifts
    )

    const spreadsheet = this.xlsxExporter.createChildrenPerDayList(
      shifts,
      childAttendances,
      year
    )

    return await this.saveXlsxFile(
      spreadsheet,
      tenant,
      createdBy,
      uid,
      'children-per-day'
    )
  }

  async removeFile(
    tenant: string,
    uid: string,
    fileName: string
  ): Promise<void> {
    const docs = await this.db
      .collection('reports')
      .where('refPath', '==', fileName)
      .where('tenant', '==', tenant)
      .get()

    if (docs.empty) {
      throw new Error(
        `Could not find document for tenant ${tenant} with fileName ${fileName}`
      )
    }

    await this.storage.file(fileName).delete()
    await this.db.collection('reports').doc(docs.docs[0].id).delete()
  }

  private async saveXlsxFile(
    spreadsheet: SpreadsheetData,
    tenant: string,
    createdBy: string,
    uid: string,
    type: FileType
  ): Promise<FirestoreFileDocument> {
    return this.saveFile(
      buildExcelFile(spreadsheet),
      tenant,
      createdBy,
      uid,
      type
    )
  }

  private async saveFile(
    localFile: LocalFile,
    tenant: string,
    createdBy: string,
    uid: string,
    type: FileType
  ): Promise<FirestoreFileDocument> {
    const bucketFileName = await this.uploadFile(tenant, localFile)

    const doc: FirestoreFileDocument = {
      expires: this.getFileExpirationDate(),
      created: new Date(),
      createdBy,
      createdByUid: uid,
      description: localFile.description ?? '',
      format: localFile.format,
      refPath: bucketFileName,
      tenant,
      type,
    }

    const id = await this.saveToFirestore(doc)

    return { ...doc, id }
  }

  private getFileExpirationDate(): Date {
    // Document expires in a year from now
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    return expires
  }

  /**
   * Upload a file to the storage bucket
   *
   * @return The name of the file in the file storage bucket
   */
  private async uploadFile(
    tenant: string,
    localFile: LocalFile
  ): Promise<string> {
    // Upload to storage
    const name = `${new Date().getTime()} ${tenant} ${
      localFile.downloadFileName
    }`

    await this.storage.file(name).save(localFile.file, {
      metadata: {
        metadata: {
          tenant: tenant,
          expires: this.getFileExpirationDate().getTime().toString(),
        },

        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
        // https://stackoverflow.com/questions/1741353/how-to-set-response-filename-without-forcing-saveas-dialog
        contentDisposition: `inline; filename="${localFile.downloadFileName}"`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    return name
  }

  /** @returns id of new document */
  private async saveToFirestore(doc: FirestoreFileDocument): Promise<string> {
    const savedDoc = await this.db.collection('reports').add(doc)

    return savedDoc.id
  }
}
