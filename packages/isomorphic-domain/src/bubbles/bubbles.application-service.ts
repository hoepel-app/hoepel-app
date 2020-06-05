import { Bubbles } from './bubbles'
import { Observable, of } from 'rxjs'
import { BubblesRepository } from './bubbles.repository'
import { map, first, flatMap } from 'rxjs/operators'
import { Child } from '@hoepel.app/types'
import { CommandResult } from '@hoepel.app/ddd-library'
import { Bubble } from './bubble'

export class BubblesApplicationService {
  constructor(private readonly bubblesRepo: BubblesRepository) {}

  findBubbles(tenantId: string): Observable<Bubbles> {
    return this.bubblesRepo.getForTenant(tenantId)
  }

  childrenForBubble(
    tenantId: string,
    bubbleName: string,
    weekIdentifier: string,
    getManyChildrenByIds: (
      childIds: readonly string[]
    ) => Observable<readonly Child[]>
  ): Observable<readonly Child[]> {
    return this.bubblesRepo.getForTenant(tenantId).pipe(
      flatMap((bubbles) => {
        const bubble = bubbles.findBubbleByName(bubbleName)

        if (bubble == null) {
          return of([])
        }

        return getManyChildrenByIds(bubble.childIdsInBubble(weekIdentifier))
      })
    )
  }

  bubbleForChild(
    tenantId: string,
    weekIdentifier: string,
    childId: string
  ): Observable<Bubble | null> {
    return this.bubblesRepo
      .getForTenant(tenantId)
      .pipe(
        map((bubbles) =>
          bubbles.findBubbleChildIsAssignedTo(weekIdentifier, childId)
        )
      )
  }

  async addChildToBubble(
    tenantId: string,
    bubbleName: string,
    weekIdentifier: string,
    childId: string
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    if (!bubbles.bubbleWithNameExists(bubbleName)) {
      return {
        status: 'rejected',
        reason: 'Can not add child to bubble: bubble with name does not exist',
      }
    }

    if (bubbles.childIsAssignedABubble(weekIdentifier, childId)) {
      return {
        status: 'rejected',
        reason: 'Child is already assigned to a bubble',
      }
    }

    await this.bubblesRepo.put(
      bubbles.withChildAddedToBubble(bubbleName, weekIdentifier, childId)
    )

    return { status: 'accepted' }
  }

  async removeChildFromBubble(
    tenantId: string,
    bubbleName: string,
    weekIdentifier: string,
    childId: string
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    if (!bubbles.bubbleWithNameExists(bubbleName)) {
      return {
        status: 'rejected',
        reason:
          'Can not remove child from bubble: bubble with name does not exist',
      }
    }

    if (
      bubbles
        .findBubbleByName(bubbleName)
        ?.includesChild(weekIdentifier, childId) !== true
    ) {
      return {
        status: 'rejected',
        reason: 'Can not remove child from bubble: child is not in bubble',
      }
    }

    await this.bubblesRepo.put(
      bubbles.withChildRemovedFromBubble(bubbleName, weekIdentifier, childId)
    )

    return { status: 'accepted' }
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

  async deleteBubble(
    tenantId: string,
    bubbleName: string
  ): Promise<CommandResult> {
    const bubbles = await this.findBubbles(tenantId).pipe(first()).toPromise()

    const bubble = bubbles.findBubbleByName(bubbleName)

    if (bubble == null) {
      return {
        status: 'rejected',
        reason: 'Bubble not found; could not remove it',
      }
    }

    if (bubble.numChildrenTotal !== 0) {
      return {
        status: 'rejected',
        reason: 'Could not remove bubble as there are children attached to it',
      }
    }

    await this.bubblesRepo.put(bubbles.withBubbleRemoved(bubbleName))
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

    if (!bubbles.bubbleWithNameExists(oldBubbleName)) {
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

    if (!bubbles.bubbleWithNameExists(bubbleName)) {
      return { status: 'rejected', reason: 'Bubble with name not found' }
    }

    await this.bubblesRepo.put(
      bubbles.withChangedMaxChildrenForBubble(bubbleName, newMaxChildren)
    )

    return { status: 'accepted' }
  }
}
