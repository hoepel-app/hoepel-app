export type BubbleProps = {
  readonly name: string
  readonly maxChildren: number
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
      maxChildren,
      name,
    })
  }

  get name(): string {
    return this.props.name
  }

  get maxChildren(): number {
    return this.props.maxChildren
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
}
