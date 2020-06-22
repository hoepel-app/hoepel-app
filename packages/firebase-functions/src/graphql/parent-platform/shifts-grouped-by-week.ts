import {
  WeekIdentifier,
  ChildAttendanceIntentionApplicationService,
  BubblesApplicationService,
} from '@hoepel.app/isomorphic-domain'
import {
  FirestoreChildAttendanceIntentionRepository,
  FirestoreBubblesRepository,
  FirestoreShiftRepository,
} from '@hoepel.app/isomorphic-data'
import { first } from 'rxjs/operators'
import { ParentPlatform } from './parent-platform'
import { LocalTime, DayDate } from '@hoepel.app/types'

const formatDuration = (start: LocalTime, end: LocalTime): string => {
  return `${start.toString()}-${end.toString()}`
}

const bubblesService = new BubblesApplicationService(
  new FirestoreBubblesRepository()
)
const attendanceIntentionService = new ChildAttendanceIntentionApplicationService(
  new FirestoreChildAttendanceIntentionRepository(),
  bubblesService
)
const shiftRepo = new FirestoreShiftRepository()

export class ShiftsGroupedByWeek {
  static async attendanceIntentionsForChild(
    organisationId: string,
    week: WeekIdentifier,
    childId: string,
    parentUid: string
  ): Promise<{
    year: number
    weekNumber: number
    childId: string
    preferredBubbleName: string | null
    status: string
    shifts: readonly {
      id: string
      description: string
      location: string
      start: Date
      end: Date
      date: DayDate
      durationFormatted: string
      kind: string
      price: string
    }[]
    organisationId: string
  } | null> {
    // Check if parent manages child
    const managedByParent = await ParentPlatform.childrenManagedByMe(
      parentUid,
      organisationId
    )

    if (!managedByParent.map((child) => child.id).includes(childId)) {
      throw new Error(`Parent ${parentUid} can not acces child ${childId}`)
    }

    const attendance = await attendanceIntentionService
      .getAttendanceIntentionsForChildInWeek(organisationId, childId, week)
      .pipe(first())
      .toPromise()

    if (attendance == null) {
      return null
    } else {
      const shifts = (
        await shiftRepo
          .findMany(organisationId, attendance.shiftIds)
          .pipe(first())
          .toPromise()
      ).map((shift) => {
        return {
          id: shift.id,
          description: shift.description,
          location: shift.location,
          start: shift.start,
          end: shift.end,
          durationFormatted: formatDuration(shift.startTime, shift.endTime),
          kind: shift.presetName,
          price: shift.price.toString(),
          date: shift.date,
        }
      })

      return {
        childId: attendance.childId,
        preferredBubbleName: attendance.preferredBubbleName,
        status: attendance.status.replace(/\-/g, '_'),
        shifts,
        organisationId,
        year: week.year,
        weekNumber: week.weekNumber,
      }
    }
  }
}
