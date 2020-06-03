import * as admin from 'firebase-admin'
import { Child, IChild, DayDate } from '@hoepel.app/types'
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

const db = admin.firestore()

const tenantRepo = createTenantRepository(db)
const shiftRepo = new FirestoreShiftRepository()

const service = new ChildRegistrationWaitingListApplicationService(
  new FirestoreChildRegistrationWaitingListRepository()
)

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
      day: DayDate
      shifts: readonly {
        id: string
        description: string
        location: string
        start: Date
        end: Date
        kind: string
        price: string
      }[]
    }[]
  > {
    const shifts = await shiftRepo
      .findInYear(organisationId, year)
      .pipe(first())
      .toPromise()

    return Object.entries(groupBy(shifts, (shift) => shift.date.id)).map(
      ([dayId, shifts]) => {
        return {
          day: DayDate.fromDayId(dayId),
          shifts: shifts.map((shift) => {
            return {
              id: shift.id,
              description: shift.description,
              location: shift.location,
              start: shift.start,
              end: shift.end,
              kind: shift.presetName,
              price: shift.price.toString(),
            }
          }),
        }
      }
    )
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
