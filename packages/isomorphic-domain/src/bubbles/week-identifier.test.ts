import { WeekIdentifier } from './week-identifier'
import { DayDate } from '@hoepel.app/types'

describe('WeekIdentifier', () => {
  it('can construct a week identifier from a date', () => {
    const date = DayDate.fromNative(new Date(1591430154000))
    const weekId = WeekIdentifier.forDate(date)

    expect(weekId).toMatchInlineSnapshot(`
      WeekIdentifier {
        "weekNumber": 23,
        "year": 2020,
      }
    `)
    expect(weekId.value).toEqual('2020-23')
  })

  it('can create a week identifier from string id', () => {
    const date = DayDate.fromNative(new Date(1591430154000))
    const weekId = WeekIdentifier.forDate(date)

    expect(WeekIdentifier.fromWeekIdentifier(weekId.value)).toEqual(weekId)
  })

  it('gives a range of day dates for a week', () => {
    const date = DayDate.fromNative(new Date(1591430154000))
    const weekId = WeekIdentifier.forDate(date)

    expect(weekId.range).toMatchInlineSnapshot(`
      DayDateRange {
        "from": DayDate {
          "day": 1,
          "month": 6,
          "year": 2020,
        },
        "to": DayDate {
          "day": 7,
          "month": 6,
          "year": 2020,
        },
      }
    `)
  })

  it('tells if a date belongs to this week or not', () => {
    const date = DayDate.fromNative(new Date(1591430154000))
    const weekId = WeekIdentifier.forDate(date)

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 9,
          month: 12,
          year: 2020,
        })
      )
    ).toBeFalsy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 6,
          month: 6,
          year: 2020,
        })
      )
    ).toBeTruthy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 6,
          month: 6,
          year: 2019,
        })
      )
    ).toBeFalsy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 1,
          month: 6,
          year: 2020,
        })
      )
    ).toBeTruthy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 31,
          month: 5,
          year: 2020,
        })
      )
    ).toBeFalsy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 7,
          month: 6,
          year: 2020,
        })
      )
    ).toBeTruthy()

    expect(
      weekId.belongsToThisWeek(
        new DayDate({
          day: 8,
          month: 6,
          year: 2020,
        })
      )
    ).toBeFalsy()
  })
})
