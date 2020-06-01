import { DayDate, Price, LocalTime, StartAndEndTime } from '@hoepel.app/types'
import { ShiftPreset } from '../shift-presets/shift-preset'

type ShiftProps = {
  readonly id: string
  readonly tenantId: string
  readonly childrenCanAttend: boolean
  readonly crewCanAttend: boolean
  readonly description: string
  readonly location: string
  readonly dayId: string
  readonly presetName: string
  readonly priceCents: number
  readonly startMinutesSinceMidnight: number
  readonly endMinutesSinceMidnight: number
}

/** A shift: an activity or period of a day */
export class Shift {
  constructor(private readonly props: ShiftProps) {}

  static fromProps(props: ShiftProps): Shift {
    return new Shift(props)
  }

  static createFromPreset(
    tenantId: string,
    shiftId: string,
    day: DayDate,
    preset: ShiftPreset
  ): Shift {
    return Shift.fromProps({
      tenantId,
      id: shiftId,
      dayId: day.id,
      childrenCanAttend: preset.childrenCanAttend,
      crewCanAttend: preset.crewMembersCanAttend,
      description: preset.description,
      location: preset.location,
      endMinutesSinceMidnight:
        preset.startAndEndTime.start.minutesSinceMidnight,
      startMinutesSinceMidnight:
        preset.startAndEndTime.end.minutesSinceMidnight,
      presetName: preset.name,
      priceCents: preset.price.totalCents,
    })
  }

  static sorted(shifts: readonly Shift[]): readonly Shift[] {
    return [...shifts].sort((a, b) => b.start.getTime() - a.start.getTime())
  }

  toProps(): ShiftProps {
    return this.props
  }

  withChildrenCanAttend(childrenCanAttend: boolean): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      childrenCanAttend,
    })
  }

  withCrewCanAttend(crewCanAttend: boolean): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      crewCanAttend,
    })
  }

  withPrice(price: Price): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      priceCents: price.totalCents,
    })
  }

  withDescription(description: string): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      description,
    })
  }

  withLocation(location: string): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      location,
    })
  }

  withStartTime(start: LocalTime): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      startMinutesSinceMidnight: start.minutesSinceMidnight,
    })
  }

  withEndTime(end: LocalTime): Shift {
    return Shift.fromProps({
      ...this.toProps(),
      endMinutesSinceMidnight: end.minutesSinceMidnight,
    })
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get childrenCanAttend(): boolean {
    return this.props.childrenCanAttend
  }

  get crewCanAttend(): boolean {
    return this.props.crewCanAttend
  }

  get description(): string {
    return this.props.description
  }

  get location(): string {
    return this.props.location
  }

  /** @deprecated Use .date */
  get dayId(): string {
    return this.props.dayId
  }

  get date(): DayDate {
    return DayDate.fromDayId(this.props.dayId)
  }

  /** @deprecated Use .presetName */
  get kind(): string {
    return this.props.presetName
  }

  get presetName(): string {
    return this.props.presetName
  }

  get price(): Price {
    return Price.fromCents(this.props.priceCents)
  }

  get startTime(): LocalTime {
    return LocalTime.fromMinutesSinceMidnight(
      this.props.startMinutesSinceMidnight
    )
  }

  get endTime(): LocalTime {
    return LocalTime.fromMinutesSinceMidnight(
      this.props.endMinutesSinceMidnight
    )
  }

  get start(): Date {
    return this.date.nativeDayWithOffset(this.startTime)
  }

  get end(): Date {
    return this.date.nativeDayWithOffset(this.endTime)
  }

  get startAndEnd(): StartAndEndTime {
    return new StartAndEndTime({
      start: this.startTime,
      end: this.endTime,
    })
  }
}
