import { DayDate } from '@hoepel.app/types'
import {
  differenceInCalendarYears,
  differenceInDays,
  setYear,
  getYear,
} from 'date-fns'

export type SwitchOverOn = 'childs-birthday' | 'new-school-year'

export type AgeGroupProps = {
  name: string
  validForAges: readonly number[]
}

export class AgeGroup {
  private constructor(private readonly props: AgeGroupProps) {}

  belongsToThisGroup(
    birthDate: DayDate,
    switchOverOn: SwitchOverOn,
    currentDate: DayDate = DayDate.today()
  ): boolean {
    if (switchOverOn === 'childs-birthday') {
      const currentAge = differenceInCalendarYears(
        currentDate.nativeDate,
        birthDate.nativeDate
      )

      return this.validForAges.has(currentAge)
    } else {
      const newSchoolYear = this.dateIsInNewSchoolYear(currentDate)
      const hasHadBirthDay = this.hasHadBirthDayThisYear(birthDate, currentDate)

      const currentAge = differenceInCalendarYears(
        currentDate.nativeDate,
        birthDate.nativeDate
      )

      if (!newSchoolYear && hasHadBirthDay) {
        return this.validForAges.has(currentAge - 1)
      } else {
        return this.validForAges.has(currentAge)
      }
    }
  }

  static create(name: string, validForAges: ReadonlySet<number>): AgeGroup {
    return AgeGroup.fromProps({
      name,
      validForAges: [...validForAges],
    })
  }

  static fromProps(props: AgeGroupProps): AgeGroup {
    return new AgeGroup(props)
  }

  toProps(): AgeGroupProps {
    return this.props
  }

  withAgeAdded(age: number): AgeGroup {
    return AgeGroup.fromProps({
      ...this.toProps(),
      validForAges: [...new Set([...this.validForAges, age])],
    })
  }

  withAgeRemoved(age: number): AgeGroup {
    return AgeGroup.fromProps({
      ...this.toProps(),
      validForAges: [...this.validForAges].filter((a) => a !== age),
    })
  }

  withName(name: string): AgeGroup {
    return AgeGroup.fromProps({
      ...this.toProps(),
      name,
    })
  }

  agesOverlapWith(other: AgeGroup): ReadonlySet<number> {
    const otherAges = [...other.validForAges]

    return new Set(
      [...this.validForAges].filter((age) => otherAges.includes(age))
    )
  }

  private hasHadBirthDayThisYear(
    birthDate: DayDate,
    currentDate: DayDate
  ): boolean {
    const daysSinceBirthday = differenceInDays(
      currentDate.nativeDate,
      setYear(birthDate.nativeDate, getYear(currentDate.nativeDate))
    )

    return daysSinceBirthday >= 0
  }

  private dateIsInNewSchoolYear(date: DayDate): boolean {
    return date.month >= 9
  }

  get name(): string {
    return this.props.name
  }

  get validForAges(): Set<number> {
    return new Set(this.props.validForAges)
  }
}
