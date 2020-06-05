export type BubbleProps = {
  readonly name: string
  readonly maxChildren: number
  readonly childAssignments: readonly {
    readonly weekIdentifier: string
    readonly childIds: readonly string[]
  }[]
}

export class Bubble {
  private constructor(private readonly props: BubbleProps) {}

  static fromProps(props: BubbleProps): Bubble {
    return new Bubble(props)
  }

  toProps(): BubbleProps {
    return this.props
  }

  static create(name: string, maxChildren: number): Bubble {
    return this.fromProps({
      maxChildren: Math.max(0, maxChildren),
      name,
      childAssignments: [],
    })
  }

  get name(): string {
    return this.props.name
  }

  get maxChildren(): number {
    return this.props.maxChildren
  }

  get numChildrenTotal(): number {
    return this.props.childAssignments.reduce(
      (acc, curr) => new Set([...acc, ...curr.childIds]),
      new Set<string>()
    ).size
  }

  /** Returns the identifiers of the weeks a child is assigned to this bubble */
  weeksForChild(childId: string): readonly string[] {
    return this.props.childAssignments
      .filter((ass) => ass.childIds.includes(childId))
      .map((ass) => ass.weekIdentifier)
  }

  childIdsInBubble(weekIdentifier: string): readonly string[] {
    return (
      this.props.childAssignments.find(
        (week) => week.weekIdentifier === weekIdentifier
      )?.childIds ?? []
    )
  }

  isEmpty(weekIdentifier: string): boolean {
    return this.childIdsInBubble(weekIdentifier).length === 0
  }

  isFull(weekIdentifier: string): boolean {
    return this.childIdsInBubble(weekIdentifier).length >= this.maxChildren
  }

  numChildren(weekIdentifier: string): number {
    return this.childIdsInBubble(weekIdentifier).length
  }

  includesChild(weekIdentifier: string, childId: string): boolean {
    return this.childIdsInBubble(weekIdentifier).includes(childId)
  }

  withName(name: string): Bubble {
    return Bubble.fromProps({
      ...this.toProps(),
      name,
    })
  }

  withMaxChildren(maxChildren: number): Bubble {
    return Bubble.fromProps({
      ...this.toProps(),
      maxChildren,
    })
  }

  withChildAdded(weekIdentifier: string, childId: string): Bubble {
    const childIds = [
      ...this.childIdsInBubble(weekIdentifier).filter((id) => id !== childId),
      childId,
    ]

    return Bubble.fromProps({
      ...this.toProps(),
      childAssignments: [
        ...this.toProps().childAssignments.filter(
          (week) => week.weekIdentifier !== weekIdentifier
        ),
        { weekIdentifier, childIds },
      ],
    })
  }

  withChildRemoved(weekIdentifier: string, childId: string): Bubble {
    const childIds = this.childIdsInBubble(weekIdentifier).filter(
      (id) => id !== childId
    )

    return Bubble.fromProps({
      ...this.toProps(),
      childAssignments: [
        ...this.toProps().childAssignments.filter(
          (week) => week.weekIdentifier !== weekIdentifier
        ),
        { weekIdentifier, childIds },
      ],
    })
  }
}
