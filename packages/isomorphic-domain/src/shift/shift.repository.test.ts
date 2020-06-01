import {
  deserializeShift,
  serializeShift,
  SerializedShift,
} from './shift.repository'
import { Shift } from './shift'
import { DayDate } from '@hoepel.app/types'
import { ShiftPreset } from '../shift-presets'

describe('serializing and deserializing Shifts to Firestore', () => {
  const firestoreExample: SerializedShift = {
    childrenCanBePresent: false,
    crewCanBePresent: true,
    dayId: '2019-08-28',
    description: '',
    kind: 'Opkuis',
    location: '',
    price: {
      cents: 50,
      euro: 2,
    },
    tenant: 'my-tenant-id',
    startAndEnd: {
      end: {
        hour: 18,
        minute: 30,
      },
      start: {
        hour: 17,
        minute: 45,
      },
    },
  }

  const exampleShift = Shift.createFromPreset(
    'my-tenant-id-here',
    'my-shift-id-here',
    DayDate.fromDayId('2020-07-01'),
    ShiftPreset.createEmpty('my-shift-preset-name')
  )

  it('can deserialize Firestore format', () => {
    expect(deserializeShift('example-shift-id', firestoreExample))
      .toMatchInlineSnapshot(`
      Shift {
        "props": Object {
          "childrenCanAttend": false,
          "crewCanAttend": true,
          "dayId": "2019-08-28",
          "description": "",
          "endMinutesSinceMidnight": 1110,
          "id": "example-shift-id",
          "location": "",
          "presetName": "Opkuis",
          "priceCents": 250,
          "startMinutesSinceMidnight": 1065,
          "tenantId": "my-tenant-id",
        },
      }
    `)
  })

  it('can serialize Shift', () => {
    expect(serializeShift(exampleShift)).toMatchInlineSnapshot(`
      Object {
        "id": "my-shift-id-here",
        "shift": Object {
          "childrenCanBePresent": true,
          "crewCanBePresent": true,
          "dayId": "2020-07-01",
          "description": "",
          "kind": "my-shift-preset-name",
          "location": "",
          "price": Object {
            "cents": 0,
            "euro": 0,
          },
          "startAndEnd": Object {
            "end": Object {
              "hour": 9,
              "minute": 0,
            },
            "start": Object {
              "hour": 17,
              "minute": 0,
            },
          },
          "tenant": "my-tenant-id-here",
        },
      }
    `)
  })

  test('deserializing then serializing yields same result', () => {
    expect(
      serializeShift(deserializeShift('example-shift-id', firestoreExample))
    ).toEqual({
      id: 'example-shift-id',
      shift: firestoreExample,
    })
  })

  test('serializing then desirializing yields same value', () => {
    expect(
      deserializeShift('my-shift-id-here', serializeShift(exampleShift).shift)
    ).toEqual(exampleShift)
  })
})
