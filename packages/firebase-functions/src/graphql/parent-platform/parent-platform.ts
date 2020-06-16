import * as admin from 'firebase-admin'
import { Child, IChild, DayDate, LocalTime } from '@hoepel.app/types'
import { createTenantRepository } from '../../services/tenant.service'
import {
  ChildOnRegistrationWaitingList,
  ChildRegistrationWaitingListApplicationService,
  BubblesApplicationService,
  ChildAttendanceIntention,
  WeekIdentifier,
  ChildAttendanceIntentionApplicationService,
} from '@hoepel.app/isomorphic-domain'
import {
  FirestoreChildRegistrationWaitingListRepository,
  FirestoreShiftRepository,
  FirestoreBubblesRepository,
  FirestoreChildAttendanceIntentionRepository,
} from '@hoepel.app/isomorphic-data'
import { first } from 'rxjs/operators'
import { groupBy } from 'lodash'
import {
  getWeek,
  setWeek,
  setYear,
  format,
  lastDayOfWeek,
  startOfWeek,
} from 'date-fns'
import { nl as locale } from 'date-fns/locale'

const db = admin.firestore()

const tenantRepo = createTenantRepository(db)
const shiftRepo = new FirestoreShiftRepository()

const bubblesService = new BubblesApplicationService(
  new FirestoreBubblesRepository()
)
const waitingListService = new ChildRegistrationWaitingListApplicationService(
  new FirestoreChildRegistrationWaitingListRepository()
)
const attendanceIntentionService = new ChildAttendanceIntentionApplicationService(
  new FirestoreChildAttendanceIntentionRepository()
)

const weekDescription = (weekNumber: number, year: number): string => {
  const week = setWeek(setYear(new Date(0), year), weekNumber, {
    locale,
  })

  const weekStart = format(startOfWeek(week, { locale }), 'd MMMM', { locale })
  const weekEnd = format(lastDayOfWeek(week, { locale }), 'd MMMM', {
    locale,
  })

  return `${weekStart} tot ${weekEnd}`
}

const formatDuration = (start: LocalTime, end: LocalTime): string => {
  return `${start.toString()}-${end.toString()}`
}

const capitalizeFirstLetter = (str: string): string =>
  str.slice(0, 1).toLocaleUpperCase() + str.slice(1)

export class ParentPlatform {
  static async childrenManagedByMe(
    parentUid: string,
    organisationId: string
  ): Promise<
    readonly {
      firstName: string
      lastName: string
      onRegistrationWaitingList: boolean
      id: string
    }[]
  > {
    // TODO should be move to external service, e.g. ChildApplicationService
    const children: readonly Child[] = (
      await db
        .collection('children')
        .where('managedByParents', 'array-contains', parentUid)
        .where('tenant', '==', organisationId)
        .get()
    ).docs.map(
      (snapshot) =>
        new Child({ ...(snapshot.data() as IChild), id: snapshot.id })
    )

    const childrenOnWaitingList = await waitingListService
      .childrenOnRegistrationWaitingListForParent(organisationId, parentUid)
      .pipe(first())
      .toPromise()

    return [
      ...childrenOnWaitingList.map((child) => {
        return {
          id: child.id,
          onRegistrationWaitingList: true,
          firstName: child.firstName,
          lastName: child.lastName,
        }
      }),
      ...children.map((child) => {
        return {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: child.id!,
          onRegistrationWaitingList: false,
          firstName: child.firstName,
          lastName: child.lastName,
        }
      }),
    ]
  }

  static async shiftsAvailable(
    organisationId: string,
    year: number
  ): Promise<
    readonly {
      weekNumber: number
      weekDescription: string
      year: number
      organisationId: string
      days: readonly {
        day: DayDate
        dayFormatted: string
        shifts: readonly {
          id: string
          description: string
          location: string
          start: Date
          end: Date
          durationFormatted: string
          kind: string
          price: string
        }[]
      }[]
    }[]
  > {
    const shifts = (
      await shiftRepo.findInYear(organisationId, year).pipe(first()).toPromise()
    ).filter((shift) => shift.childrenCanAttend)

    return Object.entries(
      groupBy(shifts, (shift) =>
        getWeek(shift.date.nativeDate, {
          locale,
        })
      )
    )
      .map(([weekNum, shifts]) => {
        const weekNumber = parseInt(weekNum, 10)

        return {
          weekNumber,
          year,
          organisationId,
          weekDescription: weekDescription(weekNumber, year),
          days: Object.entries(groupBy(shifts, (shift) => shift.date.id))
            .map(([dayId, shifts]) => {
              const dayFormatted = capitalizeFirstLetter(
                format(DayDate.fromDayId(dayId).nativeDate, 'EEEE d MMMM', {
                  locale,
                })
              )

              return {
                day: DayDate.fromDayId(dayId),
                dayFormatted,
                shifts: shifts.map((shift) => {
                  return {
                    id: shift.id,
                    description: shift.description,
                    location: shift.location,
                    start: shift.start,
                    end: shift.end,
                    durationFormatted: formatDuration(
                      shift.startTime,
                      shift.endTime
                    ),
                    kind: shift.presetName,
                    price: shift.price.toString(),
                  }
                }),
              }
            })
            .sort((a, b) => a.day.compareTo(b.day)),
        }
      })
      .sort((a, b) => a.weekNumber - b.weekNumber)
  }

  static async registerChildFromParentPlatform(
    newChild: ChildOnRegistrationWaitingList
  ): Promise<void> {
    // First check if organisation accepts external registrations
    const tenant = await tenantRepo.get(newChild.tenantId)

    if (tenant.enableOnlineRegistration !== true) {
      throw new Error(
        `Organisation '${newChild.tenantId}' does not accept online registrations`
      )
    }

    // Save child
    await waitingListService.addChildToWaitingList(newChild)
  }

  static async findBubbles(
    organisationId: string,
    year: number,
    weekNumber: number
  ): Promise<
    readonly {
      name: string
      spotsLeft?: number
      totalSpots: number
    }[]
  > {
    const bubbles = await bubblesService
      .findBubbles(organisationId)
      .pipe(first())
      .toPromise()

    return bubbles.bubbles.map((bubble) => {
      return {
        name: bubble.name,
        totalSpots: bubble.maxChildren,
      }
    })
  }

  static async registerChildAttendanceIntentionFromParentPlatform(
    organisationId: string,
    parentUid: string,
    {
      childId,
      preferredBubbleName,
      week,
      shifts: shiftIds,
    }: {
      childId: string
      preferredBubbleName: string | null
      week: WeekIdentifier
      shifts: readonly string[]
    }
  ): Promise<void> {
    // First check if organisation accepts external registrations
    const tenant = await tenantRepo.get(organisationId)

    if (tenant.enableOnlineEnrollment !== true) {
      throw new Error(
        `Organisation '${organisationId}' does not accept online registrations`
      )
    }

    // Check if parent manages child
    const managedByParent = await ParentPlatform.childrenManagedByMe(
      parentUid,
      organisationId
    )

    if (!managedByParent.map((child) => child.id).includes(childId)) {
      throw new Error(`Parent ${parentUid} can not acces child ${childId}`)
    }

    // Verify shifts
    const shifts = await shiftRepo
      .findMany(organisationId, shiftIds)
      .pipe(first())
      .toPromise()

    if (shifts.length !== shiftIds.length) {
      throw new Error(
        'Could not find all shifts - they may not exist or be assigned to a different tenant'
      )
    }

    const onRegistrationWaitingList = await waitingListService
      .isOnRegistrationWaitingList(organisationId, childId)
      .pipe(first())
      .toPromise()

    const shiftsNotInWeek = shifts
      .filter((shift) => !week.belongsToThisWeek(shift.date))
      .map((shift) => shift.id)
    if (shiftsNotInWeek.length > 0) {
      throw new Error(
        `The following shifts are not in week ${
          week.value
        }: ${shiftsNotInWeek.join(', ')}`
      )
    }

    const attendanceIntention = ChildAttendanceIntention.create(
      organisationId,
      childId,
      preferredBubbleName || null,
      week.year,
      week.weekNumber,
      shiftIds,
      new Date(),
      onRegistrationWaitingList
        ? 'child-on-registration-waiting-list'
        : 'pending'
    )

    await attendanceIntentionService.registerChildAttendanceIntentionForWeek(
      attendanceIntention
    )
  }

  static async unregisterPendingChildAttendanceIntentionFromParentPlatform(
    organisationId: string,
    parentUid: string,
    childId: string,
    week: WeekIdentifier
  ): Promise<void> {
    // Check if parent manages child
    const managedByParent = await ParentPlatform.childrenManagedByMe(
      parentUid,
      organisationId
    )

    if (!managedByParent.map((child) => child.id).includes(childId)) {
      throw new Error(`Parent ${parentUid} can not acces child ${childId}`)
    }

    await attendanceIntentionService.unregisterPendingChildAttendanceIntentionForWeek(
      organisationId,
      childId,
      week
    )
  }
}
