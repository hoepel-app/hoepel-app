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
