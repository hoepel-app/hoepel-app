import { Price } from '@hoepel.app/types'

export type ShiftPresetProps = {
  readonly name: string
  readonly priceCents: number
  readonly childrenCanBePresent: boolean
  readonly crewCanBePresent: boolean

  /** Can be empty string */
  readonly location: string

  /** Can be empty string */
  readonly description: string
}

export class ShiftPreset {
  private constructor(private readonly props: ShiftPresetProps) {}

  get price(): Price {
    return Price.fromCents(this.props.priceCents)
  }

  get name(): string {
    return this.props.name
  }

  get childrenCanBePresent(): boolean {
    return this.props.childrenCanBePresent
  }

  get crewCanBePresent(): boolean {
    return this.props.crewCanBePresent
  }

  get location(): string {
    return this.props.location
  }

  get description(): string {
    return this.props.description
  }

  static createEmpty(name: string): ShiftPreset {
    return new ShiftPreset({
      priceCents: 0,
      name,
      childrenCanBePresent: true,
      crewCanBePresent: true,
      description: '',
      location: '',
    })
  }

  static fromProps(props: ShiftPresetProps): ShiftPreset {
    return new ShiftPreset(props)
  }

  toProps(): ShiftPresetProps {
    return this.props
  }

  withName(name: string): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      name,
    })
  }

  withPrice(price: Price): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      priceCents: price.totalCents,
    })
  }

  withChildrenCanBePresent(childrenCanBePresent: boolean): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      childrenCanBePresent,
    })
  }

  withCrewCanBePresent(crewCanBePresent: boolean): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      crewCanBePresent,
    })
  }

  withLocation(location: string): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      location,
    })
  }

  withDescription(description: string): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      description,
    })
  }
}

// export interface IShift {
//     readonly startAndEnd?: IStartAndEndTime;
// }