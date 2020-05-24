import { Bubbles } from './bubbles'
import { Observable, combineLatest, of } from 'rxjs'
import { BubblesRepository } from './bubbles.repository'
import { map, first, switchMap } from 'rxjs/operators'
import { Child } from '@hoepel.app/types'
import { CommandResult } from '@hoepel.app/ddd-library'
import { Bubble } from './bubble'
import { ChildToBubbleRepository } from './child-to-bubble.repository'

export class BubblesApplicationService {
  constructor(
    private readonly bubblesRepo: BubblesRepository,
    private readonly childToBubbleRepo: ChildToBubbleRepository
  ) {}

  findBubbles(tenantId: string): Observable<Bubbles> {
    return this.bubblesRepo.getForTenant(tenantId)
  }

  isBubbleFull(
    tenantId: string,
    bubbleName: string
  ): Observable<boolean | null> {
    return this.bubbleFillRate(tenantId, bubbleName).pipe(
      map((fillRate) => {
        if (fillRate == null) {
          return null
        }

        return fillRate.currentChildren === fillRate.maxChildren
      })
    )
  }

  isBubbleEmpty(
    tenantId: string,
    bubbleName: string
  ): Observable<boolean | null> {
    return this.bubbleFillRate(tenantId, bubbleName).pipe(
      map((fillRate) => {
        if (fillRate == null) {
          return null
        }

        return fillRate.currentChildren === 0
      })
    )
  }

  bubbleFillRate(
    tenantId: string,
    bubbleName: string
  ): Observable<{ maxChildren: number; currentChildren: number } | null> {
    return combineLatest([
      this.childrenForBubble(tenantId, bubbleName),
      this.findBubbles(tenantId),
    ]).pipe(
      map(([childrenForBubble, bubbles]) => {
        const bubble = bubbles.findBubbleByName(bubbleName)

        if (bubble == null) {
          return null
        }

        return {
          maxChildren: bubble.maxChildren,
          currentChildren: childrenForBubble.length,
        }
      })
    )
  }

  childrenForBubble(
    tenantId: string,
    bubbleName: string
  ): Observable<readonly Child[]> {
    return this.childToBubbleRepo.childrenInBubble(tenantId, bubbleName)
  }

  bubbleForChild(tenantId: string, childId: string): Observable<Bubble | null> {
    return this.childToBubbleRepo.bubbleForChild(tenantId, childId).pipe(
      switchMap((bubbleName) => {
        if (bubbleName == null) {
          return of(null)
        }

        return this.findBubbles(tenantId).pipe(
          map((bubbles) => bubbles.findBubbleByName(bubbleName))
        )
      })
    )
  }

  async addChildToBubble(
    tenantId: string,
    bubbleName: string,
    childId: string
  ): Promise<CommandResult> {
    try {
      await this.childToBubbleRepo.addChildToBubble(
        tenantId,
        childId,
        bubbleName
      )
      return { status: 'accepted' }
    } catch (err) {
      return {
        status: 'rejected',
        reason: `Failed while adding child to bubble: ${err}`,
      }
    }
  }

  async createBubble(
    tenantId: string,
    bubbleName: string,
    maxChildren: number
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    if (bubbles.bubbleWithNameExists(bubbleName)) {
      return { status: 'rejected', reason: 'Bubble with name exists' }
    }

    await this.bubblesRepo.put(
      bubbles.withBubbleAdded(Bubble.create(bubbleName, maxChildren))
    )

    return { status: 'accepted' }
  }

  async renameBubble(
    tenantId: string,
    oldBubbleName: string,
    newBubbleName: string
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    if (bubbles.bubbleWithNameExists(newBubbleName)) {
      return { status: 'rejected', reason: 'Bubble with name already exists' }
    }

    if (!bubbles.bubbleWithNameExists(newBubbleName)) {
      return {
        status: 'rejected',
        reason: 'Bubble with name does not exist, can not rename',
      }
    }

    await this.bubblesRepo.put(
      bubbles.withRenamedBubble(oldBubbleName, newBubbleName)
    )

    return { status: 'accepted' }
  }

  async setBubbleMaxChildren(
    tenantId: string,
    bubbleName: string,
    newMaxChildren: number
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    if (bubbles.bubbleWithNameExists(bubbleName)) {
      return { status: 'rejected', reason: 'Bubble with name already exists' }
    }

    await this.bubblesRepo.put(
      bubbles.withChangedMaxChildrenForBubble(bubbleName, newMaxChildren)
    )

    return { status: 'accepted' }
  }
}
