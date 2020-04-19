import { DayDate } from '@hoepel.app/types'
import { AgeGroup } from './age-group'

describe('Age group based on current age', () => {
  it('classifies a person as belonging according to their current age', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2018-06-05'),
        'childs-birthday',
        DayDate.fromISO8601('2020-08-09')
      )
    ).toBe(true)
  })

  it('classifies a person as not belonging according to their current age', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2008-06-05'),
        'childs-birthday',
        DayDate.fromISO8601('2020-08-09')
      )
    ).toBe(false)
  })

  it('classifies a person as not in the age group if today is their birthday and they are older', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2015-06-13'),
        'childs-birthday',
        DayDate.fromISO8601('2020-06-13')
      )
    ).toBe(false)
  })

  it('classifies a person as in the age group if today is their birthday and they are just old enough', () => {
    const ageGroup = AgeGroup.create('Tieners', new Set([10, 11, 12]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2010-06-13'),
        'childs-birthday',
        DayDate.fromISO8601('2020-06-13')
      )
    ).toBe(true)
  })
})

describe('Age group switching only when a new school year starts', () => {
  it('classifies a person according to their current age', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2018-06-05'),
        'new-school-year',
        DayDate.fromISO8601('2020-08-09')
      )
    ).toBe(true)
  })

  it('classifies a person in the age group, even though they are older, when the school year has not yet started', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2015-02-13'),
        'new-school-year',
        DayDate.fromISO8601('2020-06-13')
      )
    ).toBe(true)
  })

  it('classifies an old enough person as not in the age group when the school year has not yet started', () => {
    const ageGroup = AgeGroup.create('Tieners', new Set([10, 11, 12]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2010-02-13'),
        'new-school-year',
        DayDate.fromISO8601('2020-06-13')
      )
    ).toBe(false)
  })

  it('classifies an old enough person as in the age group when the school year has started', () => {
    const ageGroup = AgeGroup.create('Tieners', new Set([10, 11, 12]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2010-02-13'),
        'new-school-year',
        DayDate.fromISO8601('2020-12-13')
      )
    ).toBe(true)
  })

  it('classifies an older person as not in the age group when the new school year has started', () => {
    const ageGroup = AgeGroup.create('Kleuters', new Set([0, 1, 2, 3, 4]))

    expect(
      ageGroup.belongsToThisGroup(
        DayDate.fromISO8601('2015-06-13'),
        'new-school-year',
        DayDate.fromISO8601('2020-09-13')
      )
    ).toBe(false)
  })
})

describe('AgeGroup', () => {
  describe('agesOverlapWith', () => {
    it('returns empty set when no overlap', () => {
      const ageGroup = AgeGroup.create('Kleuters', new Set([2, 3, 4]))
      const otherGroup = AgeGroup.create('Tieners', new Set([10, 11, 12]))

      expect(ageGroup.agesOverlapWith(otherGroup)).toEqual(new Set())
    })

    it('returns ages in both age groups', () => {
      const ageGroup = AgeGroup.create('Kleuters', new Set([2, 3, 4]))

      const otherGroup = AgeGroup.create('Mini', new Set([3, 4, 5]))

      expect(ageGroup.agesOverlapWith(otherGroup)).toEqual(new Set([3, 4]))
    })
  })

  describe('serializing then deserializing gives same object', () => {
    const group = AgeGroup.create('Tieners', new Set([10, 11, 12]))

    expect(AgeGroup.fromProps(group.toProps())).toEqual(group)
  })
})
