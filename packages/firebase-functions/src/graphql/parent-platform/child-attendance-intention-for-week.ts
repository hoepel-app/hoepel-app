import {
  WeekIdentifier,
  BubblesApplicationService,
} from '@hoepel.app/isomorphic-domain'
import { FirestoreBubblesRepository } from '@hoepel.app/isomorphic-data'
import { first } from 'rxjs/operators'

const bubblesRepo = new FirestoreBubblesRepository()
const bubblesService = new BubblesApplicationService(bubblesRepo)

export class ChildAttendanceIntentionForWeek {
  static async assignedBubbleName(
    organisationId: string,
    childId: string,
    week: WeekIdentifier
  ): Promise<string | null> {
    const bubble = await bubblesService
      .bubbleForChild(organisationId, week, childId)
      .pipe(first())
      .toPromise()

    if (bubble == null) {
      return null
    }

    return bubble.name
  }
}
