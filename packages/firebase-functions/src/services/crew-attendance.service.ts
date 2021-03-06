import * as admin from 'firebase-admin'
import {
  CrewAttendancesByCrewDoc,
  CrewAttendancesByShiftDoc,
  DocumentNotFoundError,
  IDetailedCrewAttendance,
  store,
  TenantIndexedRepository,
} from '@hoepel.app/types'
import { FirebaseTenantIndexedRepository } from './repository'
import { Shift } from '@hoepel.app/isomorphic-domain'

export type ICrewAttendanceByCrewRepository = TenantIndexedRepository<
  CrewAttendancesByCrewDoc & { id: string }
>
export type ICrewAttendanceByShiftRepository = TenantIndexedRepository<
  CrewAttendancesByShiftDoc & { id: string }
>

export const createCrewAttendanceByCrewRepository = (
  db: admin.firestore.Firestore
): ICrewAttendanceByCrewRepository => {
  return new FirebaseTenantIndexedRepository<
    CrewAttendancesByCrewDoc,
    CrewAttendancesByCrewDoc & { id: string }
  >(db, store.crewAttendancesByCrew)
}

export const createCrewAttendanceByShiftRepository = (
  db: admin.firestore.Firestore
): ICrewAttendanceByShiftRepository => {
  return new FirebaseTenantIndexedRepository<
    CrewAttendancesByShiftDoc,
    CrewAttendancesByShiftDoc & { id: string }
  >(db, store.crewAttendancesByShift)
}

export class CrewAttendanceService {
  constructor(
    private readonly byCrewRepository: ICrewAttendanceByCrewRepository,
    private readonly byShiftRepository: ICrewAttendanceByShiftRepository
  ) {}

  async getAttendancesForCrew(
    tenant: string,
    crewId: string
  ): Promise<{ [p: string]: IDetailedCrewAttendance }> {
    try {
      const data = await this.byCrewRepository.get(tenant, crewId)

      return data && data.attendances ? data.attendances : {}
    } catch (e) {
      if (e instanceof DocumentNotFoundError) {
        return {}
      } else {
        throw e
      }
    }
  }

  async getCrewAttendancesOnShifts(
    tenant: string,
    shifts: ReadonlyArray<Shift>
  ): Promise<
    ReadonlyArray<{
      shiftId: string
      attendances: { [crewId: string]: IDetailedCrewAttendance }
    }>
  > {
    if (shifts.length === 0) {
      return Promise.resolve([])
    }

    const all = await this.byShiftRepository.getMany(
      tenant,
      shifts.map((shift) => shift.id).filter((id) => id != null) as string[]
    )

    return all.map((attendance) => {
      return {
        shiftId: attendance.id,
        attendances: attendance.attendances,
      }
    })
  }
}
