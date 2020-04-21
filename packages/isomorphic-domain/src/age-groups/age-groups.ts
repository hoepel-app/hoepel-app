import { AgeGroupProps, AgeGroup, SwitchOverOn } from './age-group'
import { DayDate } from '@hoepel.app/types'

export type AgeGroupsProps = {
  ageGroups: readonly AgeGroupProps[]
  switchOverOn: SwitchOverOn
}
export class AgeGroups {
  private constructor(private readonly props: AgeGroupsProps) {}

  get ageGroups(): readonly AgeGroup[] {
    return this.props.ageGroups.map((ageGroup) => AgeGroup.fromProps(ageGroup))
  }

  get names(): ReadonlySet<string> {
    return new Set(this.ageGroups.map((group) => group.name))
  }

  get switchOverOn(): SwitchOverOn {
    return this.props.switchOverOn
  }

  /** Ages that are not in use yet by any age group */
  get unusedAges(): ReadonlySet<number> {
    const usedAges = this.usedAges
    return new Set(
      [...AgeGroups.validAges.values()].filter((age) => !usedAges.has(age))
    )
  }

  get usedAges(): ReadonlySet<number> {
    const ages = this.ageGroups.map((group) => group.validForAges)

    return ages.reduce(
      (acc, curr) => new Set([...acc, ...curr]),
      new Set<number>()
    )
  }

  static fromProps(props: AgeGroupsProps): AgeGroups {
    return new AgeGroups(props)
  }

  static create(switchOverOn: SwitchOverOn): AgeGroups {
    return this.fromProps({
      switchOverOn,
      ageGroups: [],
    })
  }

  static createEmpty(): AgeGroups {
    return this.create('childs-birthday')
  }

  static get validAges(): ReadonlySet<number> {
    return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  }

  toProps(): AgeGroupsProps {
    return {
      switchOverOn: this.switchOverOn,
      ageGroups: this.ageGroups.map((group) => group.toProps()),
    }
  }

  withAddedAgeGroup(ageGroup: AgeGroup): AgeGroups {
    return AgeGroups.fromProps({
      ...this.toProps(),
      ageGroups: [...this.toProps().ageGroups, ageGroup.toProps()],
    })
  }

  withSwitchOverOn(switchOverOn: SwitchOverOn): AgeGroups {
    return AgeGroups.fromProps({
      ...this.toProps(),
      switchOverOn,
    })
  }

  withAgeGroupRemoved(ageGroupName: string): AgeGroups {
    return AgeGroups.fromProps({
      ...this.toProps(),
      ageGroups: this.ageGroups
        .filter((group) => group.name !== ageGroupName)
        .map((group) => group.toProps()),
    })
  }

  classifyPerson(
    birthDate: DayDate,
    currentDate: DayDate = DayDate.today()
  ): AgeGroup | null {
    return (
      this.ageGroups.find((ageGroup) =>
        ageGroup.belongsToThisGroup(birthDate, this.switchOverOn, currentDate)
      ) || null
    )
  }

  mayAddAgeGroup(ageGroup: AgeGroup): boolean {
    const overlap = this.ageGroups
      .map((group) => group.agesOverlapWith(ageGroup))
      .reduce((acc, set) => new Set([...acc, ...set]), new Set())

    const nameAlreadyExists = this.names.has(ageGroup.name)

    return overlap.size === 0 && !nameAlreadyExists
  }

  findAgeGroupWithName(name: string): AgeGroup | null {
    return this.ageGroups.find((group) => group.name === name) || null
  }
}
