import * as admin from 'firebase-admin'
import { Child, IChild, DayDate, LocalTime } from '@hoepel.app/types'
import { createTenantRepository } from '../../services/tenant.service'
import {
  ChildOnRegistrationWaitingList,
  ChildRegistrationWaitingListApplicationService,
} from '@hoepel.app/isomorphic-domain'
import {
  FirestoreChildRegistrationWaitingListRepository,
  FirestoreShiftRepository,
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

const service = new ChildRegistrationWaitingListApplicationService(
  new FirestoreChildRegistrationWaitingListRepository()
)

const weekDescription = (weekNumber: number, year: number): string => {
  const week = setWeek(setYear(new Date(0), year), weekNumber, {
    locale,
  })

  const weekStart = format(startOfWeek(week, { locale }), 'd', { locale })
  const weekEnd = format(lastDayOfWeek(week, { locale }), 'd MMMM', {
    locale,
  })

  return `${weekStart} tot ${weekEnd}`
}

const formatDuration = (start: LocalTime, end: LocalTime): string => {
  return `${start.toString()}-${end.toString()}`
}

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

    const childrenOnWaitingList = await service
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
          weekDescription: weekDescription(weekNumber, year),
          days: Object.entries(groupBy(shifts, (shift) => shift.date.id)).map(
            ([dayId, shifts]) => {
              return {
                day: DayDate.fromDayId(dayId),
                dayFormatted: format(
                  DayDate.fromDayId(dayId).nativeDate,
                  'EEEE d MMMM',
                  { locale }
                ),
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
            }
          ),
        }
      })
      .sort((a, b) => b.weekNumber - a.weekNumber)
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
    await service.addChildToWaitingList(newChild)
  }
}
