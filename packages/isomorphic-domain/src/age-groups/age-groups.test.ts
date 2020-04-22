import { AgeGroups } from './age-groups'
import { DayDate } from '@hoepel.app/types'
import { AgeGroup } from './age-group'

describe('Age groups based on current age', () => {
  const ageGroups = AgeGroups.create('childs-birthday')
    .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
    .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
    .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
    .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

  it('classifies a person as belonging according to their current age', () => {
    expect(
      ageGroups.classifyPerson(
        DayDate.fromISO8601('2018-06-05'),
        DayDate.fromISO8601('2020-08-09')
      )?.name
    ).toEqual('Kleuters')
  })

  it('classifies a person as not belonging according to their current age', () => {
    const ageGroup = ageGroups.classifyPerson(
      DayDate.fromISO8601('2008-06-05'),
      DayDate.fromISO8601('2020-08-09')
    )

    expect(ageGroup?.name).not.toEqual('Kleuters')
    expect(ageGroup?.name).not.toEqual('Mini')
  })

  it('classifies a person as not in the age group if today is their birthday and they are older', () => {
    const ageGroup = ageGroups.classifyPerson(
      DayDate.fromISO8601('2015-06-13'),
      DayDate.fromISO8601('2020-06-13')
    )

    expect(ageGroup?.name).not.toEqual('Kleuters')
    expect(ageGroup?.name).toEqual('Mini')
  })

  it('returns null if no age groups match', () => {
    const ageGroup = ageGroups.classifyPerson(
      DayDate.fromISO8601('2019-06-13'),
      DayDate.fromISO8601('2020-06-13')
    )

    expect(ageGroup).toBeNull()
  })

  it('classifies a person as in the age group if today is their birthday and they are just old enough', () => {
    expect(
      ageGroups.classifyPerson(
        DayDate.fromISO8601('2010-06-13'),
        DayDate.fromISO8601('2020-06-13')
      )?.name
    ).toEqual('Maxi')
  })
})

describe('Age groups switching only when a new school year starts', () => {
  const ageGroups = AgeGroups.create('new-school-year')
    .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
    .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
    .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
    .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

  it('classifies a person according to their current age ', () => {
    expect(
      ageGroups.classifyPerson(
        DayDate.fromISO8601('2017-06-05'),
        DayDate.fromISO8601('2020-08-09')
      )?.name
    ).toEqual('Kleuters')
  })

  it('classifies a person in the age group, even though they are older, when the school year has not yet started', () => {
    expect(
      ageGroups.classifyPerson(
        DayDate.fromISO8601('2016-02-13'),
        DayDate.fromISO8601('2020-06-13')
      )?.name
    ).toEqual('Kleuters')
  })

  it('classifies an old enough person as not in the age group when the school year has not yet started', () => {
    const ageGroup = ageGroups.classifyPerson(
      DayDate.fromISO8601('2009-02-13'),
      DayDate.fromISO8601('2020-06-13')
    )

    expect(ageGroup?.name).not.toEqual('Tieners')
    expect(ageGroup?.name).toEqual('Maxi')
  })

  it('classifies an old enough person as in the age group when the school year has started', () => {
    const ageGroup = ageGroups.classifyPerson(
      DayDate.fromISO8601('2009-02-13'),
      DayDate.fromISO8601('2020-09-13')
    )

    expect(ageGroup?.name).toEqual('Tieners')
    expect(ageGroup?.name).not.toEqual('Maxi')
  })
})

describe('AgeGroups', () => {
  const exampleGroups = AgeGroups.create('childs-birthday')
    .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
    .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
    .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
    .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

  describe('mayAddAgeGroup', () => {
    it('false when age group with name already exists', () => {
      expect(
        exampleGroups.mayAddAgeGroup(AgeGroup.create('Tieners', new Set([14])))
      ).toEqual(false)
    })

    it('false when age group overlaps with existing age group', () => {
      expect(
        exampleGroups.mayAddAgeGroup(AgeGroup.create('Super', new Set([10])))
      ).toEqual(false)
    })

    it("true when ages don't overlap and name doesn't exist yet", () => {
      expect(
        exampleGroups.mayAddAgeGroup(AgeGroup.create('Super', new Set([15])))
      ).toEqual(true)
    })
  })

  describe('findAgeGroupWithName', () => {
    it('returns null if no age group with given name can be found', async () => {
      const group = exampleGroups.findAgeGroupWithName('Middengroep')

      expect(group).toBeNull()
    })

    it('returns age group with given name', async () => {
      const group = exampleGroups.findAgeGroupWithName('Maxi')

      expect(group).toEqual(
        exampleGroups.ageGroups.find((group) => group.name === 'Maxi')
      )
    })
  })

  it('serializing and deserializing yields same object', () => {
    expect(AgeGroups.fromProps(exampleGroups.toProps())).toEqual(exampleGroups)
  })

  describe('usedAges', () => {
    it('be empty when there are no age groups', () => {
      const groups = AgeGroups.create('childs-birthday')

      expect(groups.usedAges).toEqual(new Set())
    })

    it('return a set of used ages', () => {
      expect(exampleGroups.usedAges).toEqual(
        new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
      )
    })
  })

  describe('unusedAges', () => {
    it('be empty when there are no age groups', () => {
      const groups = AgeGroups.create('childs-birthday')

      expect(groups.unusedAges).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      )
    })

    it('return a set of unused ages', () => {
      expect(exampleGroups.unusedAges).toEqual(new Set([1, 14, 15, 16]))
    })
  })

  describe('withAgeAddedToAgeGroup', () => {
    it('adds age to existing age group', () => {
      expect(
        exampleGroups.withAgeAddedToAgeGroup('Tieners', 14)
      ).toMatchSnapshot()
    })

    it('does nothing for non-existing age group', () => {
      expect(exampleGroups.withAgeAddedToAgeGroup('non-existant', 14)).toEqual(
        exampleGroups
      )
    })
  })

  describe('withAgeRemovedFromAgeGroup', () => {
    it('removess age to existing age group', () => {
      expect(
        exampleGroups.withAgeRemovedFromAgeGroup('Tieners', 13)
      ).toMatchSnapshot()
    })

    it('does nothing for non-existing age group', () => {
      expect(
        exampleGroups.withAgeRemovedFromAgeGroup('non-existant', 10)
      ).toEqual(exampleGroups)
    })
  })
})
