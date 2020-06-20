import { ChildAttendanceIntention } from './child-attendance-intention'
import { ChildAttendanceIntentionRepository } from './child-attendance-intention.repository'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { WeekIdentifier } from '../week-identifier'
import { CommandResult } from '@hoepel.app/ddd-library'
import { BubblesApplicationService } from '../bubbles'

export class ChildAttendanceIntentionApplicationService {
  constructor(
    private readonly repo: ChildAttendanceIntentionRepository,
    private readonly bubblesApplicationService: BubblesApplicationService
  ) {}

  getAttendanceIntentionsForChild(
    tenantId: string,
    childId: string
  ): Observable<ChildAttendanceIntention[]> {
    return this.repo.findForChild(tenantId, childId)
  }

  getAttendanceIntentionsForChildInWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Observable<ChildAttendanceIntention | null> {
    return this.repo.findForChildInWeek(tenantId, childId, week)
  }

  getAttendanceIntentionsForWeek(
    tenantId: string,
    weekIdentifier: WeekIdentifier
  ): Observable<ChildAttendanceIntention[]> {
    return this.repo.findForWeek(tenantId, weekIdentifier)
  }

  async registerChildAttendanceIntentionForWeek(
    newIntention: ChildAttendanceIntention
  ): Promise<CommandResult> {
    const attendanceForWeek = await this.repo
      .findForChildInWeek(
        newIntention.tenantId,
        newIntention.childId,
        newIntention.weekIdentifier
      )
      .pipe(first())
      .toPromise()

    if (attendanceForWeek != null) {
      return {
        status: 'rejected',
        reason: 'Already registered for this week',
      }
    }

    await this.repo.put(newIntention)

    return {
      status: 'accepted',
    }
  }

  async unregisterPendingChildAttendanceIntentionForWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Promise<CommandResult> {
    const attendanceForWeek = await this.repo
      .findForChildInWeek(tenantId, childId, week)
      .pipe(first())
      .toPromise()

    if (attendanceForWeek == null) {
      return {
        status: 'rejected',
        reason: 'Not registered for this week',
      }
    }

    if (attendanceForWeek.status !== 'pending') {
      return {
        status: 'rejected',
        reason: 'This attendance intention is not in the pending state',
      }
    }

    await this.repo.remove(tenantId, childId, week)

    return {
      status: 'accepted',
    }
  }

  /**
   * After moving a child from the registration waiting list, call this method to move attendance intentions
   *
   * Does nothing when child is not on registration waiting list
   */
  async moveChildFromRegistrationWaitingList(
    tenantId: string,
    childOnRegistrationWaitingListId: string,
    newChildId: string
  ): Promise<CommandResult> {
    const attendances = (
      await this.getAttendanceIntentionsForChild(
        tenantId,
        childOnRegistrationWaitingListId
      )
        .pipe(first())
        .toPromise()
    ).filter((att) => att.status === 'child-on-registration-waiting-list')

    if (attendances.length === 0) {
      // No attendance intentions => not a failure
      return {
        status: 'accepted',
      }
    }

    await Promise.all(
      attendances.map(async (att) => {
        await this.repo.remove(
          tenantId,
          childOnRegistrationWaitingListId,
          att.weekIdentifier
        )
        await this.repo.put(att.withStatus('pending').withChildId(newChildId))
      })
    )

    return {
      status: 'accepted',
    }
  }

  async approveChildAttendanceIntentionForWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier,
    bubbleName?: string
  ): Promise<CommandResult> {
    const attendance = await this.getAttendanceIntentionsForChildInWeek(
      tenantId,
      childId,
      week
    )
      .pipe(first())
      .toPromise()

    if (attendance == null) {
      return {
        status: 'rejected',
        reason: `No attendance found to approve for ${childId} in week ${week}`,
      }
    }

    const bubbleForChild = await this.bubblesApplicationService
      .bubbleForChild(tenantId, week, childId)
      .pipe(first())
      .toPromise()

    if (bubbleName != null && bubbleForChild?.name != bubbleName) {
      return {
        status: 'rejected',
        reason: `Child ${childId} is not in bubble ${bubbleName}, can't approve attendance`,
      }
    }

    await this.repo.put(attendance.withStatus('accepted'))

    return {
      status: 'accepted',
    }
  }

  async rejectChildAttendanceIntentionForWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Promise<CommandResult> {
    const attendance = await this.getAttendanceIntentionsForChildInWeek(
      tenantId,
      childId,
      week
    )
      .pipe(first())
      .toPromise()

    if (attendance == null) {
      return {
        status: 'rejected',
        reason: `Could not find attendance for ${childId}, can't reject attendance`,
      }
    }

    await this.repo.put(attendance.withStatus('rejected'))

    return {
      status: 'accepted',
    }
  }
}
