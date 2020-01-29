import { FileType, IReport } from '@hoepel.app/types'
import * as admin from 'firebase-admin'
import { IChildRepository } from './child.service'
import { ICrewRepository } from './crew.service'
import { ShiftService } from './shift.service'
import { IContactPersonRepository } from './contact-person.service'
import { ChildAttendanceService } from './child-attendance.service'
import { CrewAttendanceService } from './crew-attendance.service'
import { SpreadsheetData, XlsxExporter } from './exporters/xlsx-exporter'
import { LocalFile } from './exporters/exporter'

type FirestoreFileDocument = IReport & { id?: string; tenant: string }

export class FileService {
  constructor(
    private xlsxExporter: XlsxExporter,
    private childRepository: IChildRepository,
    private crewRepository: ICrewRepository,
    private contactPersonRepository: IContactPersonRepository,
    private shiftService: ShiftService,
    private childAttendanceService: ChildAttendanceService,
    private crewAttendanceService: CrewAttendanceService,
    private db: admin.firestore.Firestore, // TODO refactor so this service does not use db directly
    private storage: any // Bucket
  ) {}

  async exportAllChildren(
    tenant: string,
    createdBy: string,
    uid: string
  ): Promise<FirestoreFileDocument> {
    const spreadsheet = this.xlsxExporter.createChildList(
      await this.childRepository.getAll(tenant)
    )
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
      child => child.remarks
    )
    const spreadsheet = this.xlsxExporter.createChildrenWithCommentList(
      children
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
      crew => crew.active
    )

    const shiftsForCrewAtt = await this.shiftService.getShiftsInYear(
      tenant,
      year
    )
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

    const shiftsForChildAtt = await this.shiftService.getShiftsInYear(
      tenant,
      year
    )
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

    const shiftsForFiscalCerts = await this.shiftService.getShiftsInYear(
      tenant,
      year
    )
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
    const allChildrenForFiscalCerts = await this.childRepository.getAll(tenant)
    const shifts = await this.shiftService.getShiftsInYear(tenant, year)
    const childAttendances = await this.childAttendanceService.getChildAttendancesOnShifts(
      tenant,
      shifts
    )

    const spreadsheet = this.xlsxExporter.createChildrenPerDayList(
      allChildrenForFiscalCerts,
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
    await this.db
      .collection('reports')
      .doc(docs.docs[0].id)
      .delete()
  }

  private async saveXlsxFile(
    spreadsheet: SpreadsheetData,
    tenant: string,
    createdBy: string,
    uid: string,
    type: FileType
  ): Promise<FirestoreFileDocument> {
    return this.saveFile(
      this.xlsxExporter.buildExcelFile(spreadsheet),
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
      description: localFile.description,
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
          expires: this.getFileExpirationDate()
            .getTime()
            .toString(),
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
