import { Price, StartAndEndTime } from '@hoepel.app/types'

export type ShiftPresetProps = {
  readonly name: string
  readonly priceCents: number
  readonly childrenCanAttend: boolean
  readonly crewMembersCanAttend: boolean

  /** Can be empty string */
  readonly location: string

  /** Can be empty string */
  readonly description: string

  /** Start time of shifts created using this shift preset, in minutes since midnight */
  readonly startMinutesSinceMidnight: number

  /** End time of shifts created using this shift preset, in minutes since midnight */
  readonly endMinutesSinceMidnight: number
}

export class ShiftPreset {
  private constructor(private readonly props: ShiftPresetProps) {}

  get price(): Price {
    return Price.fromCents(this.props.priceCents)
  }

  get name(): string {
    return this.props.name
  }

  get childrenCanAttend(): boolean {
    return this.props.childrenCanAttend
  }

  get crewMembersCanAttend(): boolean {
    return this.props.crewMembersCanAttend
  }

  get location(): string {
    return this.props.location
  }

  get description(): string {
    return this.props.description
  }

  get startAndEndTime(): StartAndEndTime {
    // TODO extract this logic to LocalTime/StartAndEndTime
    const startMinutes = this.props.startMinutesSinceMidnight % 60
    const startHours =
      (this.props.startMinutesSinceMidnight - startMinutes) / 60
    const endMinutes = this.props.endMinutesSinceMidnight % 60
    const endHours = (this.props.endMinutesSinceMidnight - endMinutes) / 60

    return new StartAndEndTime({
      start: { hour: startHours, minute: startMinutes },
      end: { hour: endHours, minute: endMinutes },
    })
  }

  static createEmpty(name: string): ShiftPreset {
    return new ShiftPreset({
      priceCents: 0,
      name,
      childrenCanAttend: true,
      crewMembersCanAttend: true,
      description: '',
      location: '',
      startMinutesSinceMidnight: 540, // 9:00
      endMinutesSinceMidnight: 1020, // 17:00
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

  withChildrenCanAttend(childrenCanAttend: boolean): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      childrenCanAttend,
    })
  }

  withCrewMembersCanAttend(crewMembersCanAttend: boolean): ShiftPreset {
    return ShiftPreset.fromProps({
      ...this.toProps(),
      crewMembersCanAttend,
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

  withStartAndEndTime(startAndEnd: StartAndEndTime): ShiftPreset {
    const startMinutesSinceMidnight =
      startAndEnd.start.minute + startAndEnd.start.hour * 60
    const endMinutesSinceMidnight =
      startAndEnd.end.minute + startAndEnd.end.hour * 60

    return ShiftPreset.fromProps({
      ...this.toProps(),
      startMinutesSinceMidnight,
      endMinutesSinceMidnight,
    })
  }
}
