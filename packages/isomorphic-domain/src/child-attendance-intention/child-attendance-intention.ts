import { Aggregate } from '@hoepel.app/ddd-library'
import { setWeek, setYear, startOfWeek } from 'date-fns'
import { DayDate } from '@hoepel.app/types'
import { WeekIdentifier } from '../week-identifier'

export type ChildAttendanceIntentionProps = {
  readonly tenant: string
  readonly childId: string
  readonly created: number
  readonly edited: number | null
  readonly status:
    | 'pending'
    | 'rejected'
    | 'accepted'
    | 'child-on-registration-waiting-list'
  readonly preferredBubbleName: string | null
  readonly year: number
  readonly weekNumber: number
  readonly shifts: {
    readonly id: string
    readonly didAttend: boolean
  }[]
}

/** When parents register their children, we register them for one week at a time */
export class ChildAttendanceIntention implements Aggregate {
  private constructor(private readonly props: ChildAttendanceIntentionProps) {}

  get id(): string {
    return `${this.tenantId}-${this.childId}-${this.year}-${this.weekNumber}`
  }

  toProps(): ChildAttendanceIntentionProps {
    return this.props
  }

  static fromProps(
    props: ChildAttendanceIntentionProps
  ): ChildAttendanceIntention {
    return new ChildAttendanceIntention(props)
  }

  static create(
    tenantId: string,
    childId: string,
    preferredBubbleName: string | null,
    year: number,
    weekNumber: number,
    shiftIds: readonly string[],
    created: Date,
    status: 'pending' | 'child-on-registration-waiting-list' = 'pending'
  ): ChildAttendanceIntention {
    return new ChildAttendanceIntention({
      tenant: tenantId,
      childId,
      preferredBubbleName,
      created: created.getTime(),
      status,
      edited: null,
      year,
      weekNumber,
      shifts: shiftIds.map((id) => {
        return {
          didAttend: false,
          id,
        }
      }),
    })
  }

  get weekNumber(): number {
    return this.props.weekNumber
  }

  get year(): number {
    return this.props.year
  }

  get created(): Date {
    return new Date(this.props.created)
  }

  get edited(): Date | null {
    if (this.props.edited == null) {
      return null
    }

    return new Date(this.props.edited)
  }

  get status():
    | 'pending'
    | 'rejected'
    | 'accepted'
    | 'child-on-registration-waiting-list' {
    return this.props.status
  }

  get shifts(): readonly {
    readonly id: string
    readonly didAttend: boolean
  }[] {
    return this.props.shifts
  }

  get weekStart(): DayDate {
    const dateZero = new Date(0)
    const date = startOfWeek(
      setWeek(setYear(dateZero, this.props.year), this.weekNumber, {
        weekStartsOn: 1,
      }),
      { weekStartsOn: 1 }
    )
    return DayDate.fromNative(date)
  }

  get weekIdentifier(): WeekIdentifier {
    return WeekIdentifier.fromWeekIdentifier(`${this.year}-${this.weekNumber}`)
  }

  get preferredBubbleName(): string | null {
    return this.props.preferredBubbleName
  }

  get tenantId(): string {
    return this.props.tenant
  }

  get childId(): string {
    return this.props.childId
  }

  get shiftIds(): string[] {
    return this.props.shifts.map((shift) => shift.id)
  }
}
