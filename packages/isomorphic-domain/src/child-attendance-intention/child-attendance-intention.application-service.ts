import { ChildAttendanceIntention } from './child-attendance-intention'
import { ChildAttendanceIntentionRepository } from './child-attendance-intention.repository'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { WeekIdentifier } from '../week-identifier'
import { CommandResult } from '@hoepel.app/ddd-library'

export class ChildAttendanceIntentionApplicationService {
  constructor(private readonly repo: ChildAttendanceIntentionRepository) {}

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
  ): Promise<void> {
    const attendances = (
      await this.getAttendanceIntentionsForChild(
        tenantId,
        childOnRegistrationWaitingListId
      )
        .pipe(first())
        .toPromise()
    ).filter((att) => att.status === 'child-on-registration-waiting-list')

    if (attendances.length === 0) {
      return
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
  }

  async approveChildAttendanceIntentionForWeek(
    tenantId: string,
    intentionId: string,
    bubbleName?: string
  ): Promise<void> {
    // Check if child in bubble for week
    // ...
    // Update attendance intention
    // ...
  }

  async rejectChildAttendanceIntentionForWeek(
    tenantId: string,
    intentionId: string
  ): Promise<void> {
    // TODO
  }
}
