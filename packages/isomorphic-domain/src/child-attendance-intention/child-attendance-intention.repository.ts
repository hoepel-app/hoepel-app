import { WeekIdentifier } from '../week-identifier'
import { ChildAttendanceIntention } from './child-attendance-intention'
import { Observable } from 'rxjs'

export type ChildAttendanceIntentionRepository = {
  findForWeek(
    tenantId: string,
    week: WeekIdentifier
  ): Observable<ChildAttendanceIntention[]>
  findForChild(
    tenantId: string,
    childId: string
  ): Observable<ChildAttendanceIntention[]>
  findForChildInWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Observable<ChildAttendanceIntention | null>
  put(entity: ChildAttendanceIntention): Promise<void>
}
