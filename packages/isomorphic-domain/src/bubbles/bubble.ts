export type BubbleProps = {
  readonly name: string
  readonly maxChildren: number
  readonly childIds: readonly string[]
}

export class Bubble {
  private constructor(private readonly props: BubbleProps) {}

  static fromProps(props: BubbleProps): Bubble {
    return new Bubble(props)
  }

  toProps(): BubbleProps {
    return this.props
  }

  static create(
    name: string,
    maxChildren: number,
    childIds: readonly string[]
  ): Bubble {
    return this.fromProps({
      maxChildren: Math.max(0, maxChildren),
      name,
      childIds,
    })
  }

  get name(): string {
    return this.props.name
  }

  get maxChildren(): number {
    return this.props.maxChildren
  }

  get childIdsInBubble(): readonly string[] {
    return this.props.childIds
  }

  get isEmpty(): boolean {
    return this.childIdsInBubble.length === 0
  }

  get isFull(): boolean {
    return this.childIdsInBubble.length >= this.maxChildren
  }

  get numChildren(): number {
    return this.childIdsInBubble.length
  }

  includesChild(childId: string): boolean {
    return this.childIdsInBubble.includes(childId)
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

  withChildAdded(childId: string): Bubble {
    const childIds = [
      ...this.childIdsInBubble.filter((id) => id !== childId),
      childId,
    ]

    return Bubble.fromProps({
      ...this.toProps(),
      childIds,
    })
  }

  withChildRemoved(childId: string): Bubble {
    return Bubble.fromProps({
      ...this.toProps(),
      childIds: this.childIdsInBubble.filter((id) => id !== childId),
    })
  }
}
