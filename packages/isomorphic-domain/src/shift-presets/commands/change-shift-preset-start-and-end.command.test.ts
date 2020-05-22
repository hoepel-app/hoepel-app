import { StartAndEndTime } from '@hoepel.app/types'
import { ChangeShiftPresetStartAndEndCommand } from './change-shift-preset-start-and-end.command'

describe('ChangeShiftPresetStartAndEndCommand', () => {
  it('converts start and end times', () => {
    const startAndEnd = new StartAndEndTime({
      start: { hour: 5, minute: 55 },
      end: { hour: 22, minute: 39 },
    })
    const command = ChangeShiftPresetStartAndEndCommand.create(
      'Some preset name',
      startAndEnd,
      {
        commandId: 'command-id',
        tenantId: 'my-tenant-id',
        requestedBy: { type: 'user', email: 'test@example.org', uid: 'uid' },
      }
    )

    expect(command.startAndEndTime).toEqual(startAndEnd)
  })
})
