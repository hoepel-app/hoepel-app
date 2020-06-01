import { ShiftPreset } from '../shift-presets/shift-preset'
import { Shift } from './shift'
import { DayDate } from '@hoepel.app/types'

const shiftPreset = ShiftPreset.createEmpty('my-tenant-name')

const shift1 = Shift.createFromPreset(
  'my-tenant-here',
  'shift-id-1',
  DayDate.fromDayId('2020-05-16'),
  shiftPreset
)
const shift2 = Shift.createFromPreset(
  'my-tenant-here',
  'shift-id-2',
  DayDate.fromDayId('2019-12-31'),
  shiftPreset
)
const shift3 = Shift.createFromPreset(
  'my-tenant-here',
  'shift-id-3',
  DayDate.fromDayId('2020-01-01'),
  shiftPreset
)
const shift4 = Shift.createFromPreset(
  'my-tenant-here',
  'shift-id-4',
  DayDate.fromDayId('2020-12-31'),
  shiftPreset
)
const shift5 = Shift.createFromPreset(
  'other-tenant-here',
  'shift-id-5',
  DayDate.fromDayId('2020-09-16'),
  shiftPreset
)

describe('Shift', () => {
  describe('sorted', () => {
    it('sorts shifts by date', () => {
      const sorted = Shift.sorted([shift1, shift2, shift3, shift4, shift5])

      expect(sorted).toEqual([shift4, shift5, shift1, shift3, shift2])
    })
  })
})
