import { Observable } from 'rxjs'
import { Child } from '@hoepel.app/types'

export type ChildToBubbleRepository = {
  addChildToBubble(
    tenantId: string,
    childId: string,
    bubbleName: string
  ): Promise<void>

  bubbleForChild(tenantId: string, childId: string): Observable<string | null>

  childrenInBubble(
    tenantId: string,
    bubbleName: string
  ): Observable<readonly Child[]>

  removeChildFromBubble(tenantId: string, childId: string): Promise<void>
}
