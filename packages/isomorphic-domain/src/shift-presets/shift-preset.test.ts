import { ShiftPreset } from './shift-preset'
import { Price, StartAndEndTime } from '@hoepel.app/types'

describe('ShiftPreset', () => {
  test('price', () => {
    const preset = ShiftPreset.createEmpty('Hello').withPrice(
      Price.fromCents(1234)
    )

    expect(preset.price.totalCents).toEqual(1234)
  })

  test('name', () => {
    const preset = ShiftPreset.createEmpty('My Preset Name')

    expect(preset.name).toEqual('My Preset Name')
  })

  test('withPrice', () => {
    const preset = ShiftPreset.createEmpty('Hello')
      .withPrice(Price.fromCents(1234))
      .withPrice(Price.fromCents(666))

    expect(preset.price.totalCents).toEqual(666)
  })

  test('withChildrenCanAttend', () => {
    const preset = ShiftPreset.createEmpty('My Shift Preset')

    expect(preset.withChildrenCanAttend(true).childrenCanAttend).toEqual(true)
    expect(preset.withChildrenCanAttend(false).childrenCanAttend).toEqual(false)
  })

  test('withCrewMembersCanAttend', () => {
    const preset = ShiftPreset.createEmpty('My Shift Preset')

    expect(preset.withCrewMembersCanAttend(true).crewMembersCanAttend).toEqual(
      true
    )
    expect(preset.withCrewMembersCanAttend(false).crewMembersCanAttend).toEqual(
      false
    )
  })

  test('withLocation', () => {
    const preset = ShiftPreset.createEmpty('My Shift Preset')

    expect(preset.withLocation('').location).toEqual('')
    expect(preset.withLocation('Main Location').location).toEqual(
      'Main Location'
    )
  })

  test('withDescription', () => {
    const preset = ShiftPreset.createEmpty('My Shift Preset')

    expect(preset.withDescription('').description).toEqual('')
    expect(preset.withDescription('External Activity').description).toEqual(
      'External Activity'
    )
  })

  test('withName', () => {
    const preset = ShiftPreset.createEmpty('My Shift Preset')

    expect(preset.withName('External Activity').name).toEqual(
      'External Activity'
    )
    expect(preset.withName('Something').name).toEqual('Something')
  })

  describe('createEmpty', () => {
    it('has defaults', () => {
      expect(ShiftPreset.createEmpty('My Name')).toMatchInlineSnapshot(`
        ShiftPreset {
          "props": Object {
            "childrenCanAttend": true,
            "crewMembersCanAttend": true,
            "description": "",
            "endMinutesSinceMidnight": 1020,
            "location": "",
            "name": "My Name",
            "priceCents": 0,
            "startMinutesSinceMidnight": 540,
          },
        }
      `)
    })
  })

  describe('toProps', () => {
    const preset = ShiftPreset.createEmpty('Something')
      .withChildrenCanAttend(false)
      .withCrewMembersCanAttend(true)
      .withPrice(Price.fromCents(1234))
      .withDescription('Hello description')
      .withLocation('Location here')
      .withStartAndEndTime(
        new StartAndEndTime({
          start: {
            hour: 9,
            minute: 30,
          },
          end: {
            hour: 17,
            minute: 30,
          },
        })
      )

    it('serializes object', () => {
      expect(preset.toProps()).toMatchInlineSnapshot(`
        Object {
          "childrenCanAttend": false,
          "crewMembersCanAttend": true,
          "description": "Hello description",
          "endMinutesSinceMidnight": 1050,
          "location": "Location here",
          "name": "Something",
          "priceCents": 1234,
          "startMinutesSinceMidnight": 570,
        }
      `)
    })

    it('serializes newly created object', () => {
      expect(ShiftPreset.createEmpty('Test').toProps()).toMatchInlineSnapshot(`
        Object {
          "childrenCanAttend": true,
          "crewMembersCanAttend": true,
          "description": "",
          "endMinutesSinceMidnight": 1020,
          "location": "",
          "name": "Test",
          "priceCents": 0,
          "startMinutesSinceMidnight": 540,
        }
      `)
    })

    test('ShiftPreset.fromProps(ShiftPreset#toProps) returns same object', () => {
      expect(ShiftPreset.fromProps(preset.toProps())).toEqual(preset)
    })
  })

  describe('withStartAndEndTime', () => {
    it('updates start and end time of the shift preset', () => {
      const preset = ShiftPreset.createEmpty('Some Preset')
      const startAndEnd = new StartAndEndTime({
        start: { hour: 7, minute: 23 },
        end: { hour: 19, minute: 55 },
      })
      const withStartAndEndTime = preset.withStartAndEndTime(startAndEnd)

      expect(withStartAndEndTime).not.toEqual(preset)
      expect(withStartAndEndTime.startAndEndTime).toEqual(startAndEnd)
    })
  })
})
