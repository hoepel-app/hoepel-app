import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { StartAndEndTime } from '@hoepel.app/types'

type Payload = {
  presetName: string
  startMinutesSinceMidnight: number
  endMinutesSinceMidnight: number
}

export class ChangeShiftPresetStartAndEndCommand extends CommandBase<Payload> {
  name = 'change-shift-preset-start-and-end-command' as const

  static create(
    presetName: string,
    startAndEnd: StartAndEndTime,
    commandMetadata: CommandMetadata
  ): ChangeShiftPresetStartAndEndCommand {
    const startMinutesSinceMidnight =
      startAndEnd.start.minute + startAndEnd.start.hour * 60
    const endMinutesSinceMidnight =
      startAndEnd.end.minute + startAndEnd.end.hour * 60

    return new ChangeShiftPresetStartAndEndCommand(
      { presetName, startMinutesSinceMidnight, endMinutesSinceMidnight },
      commandMetadata
    )
  }

  get startAndEndTime(): StartAndEndTime {
    const startMinutes = this.payload.startMinutesSinceMidnight % 60
    const startHours =
      (this.payload.startMinutesSinceMidnight - startMinutes) / 60
    const endMinutes = this.payload.endMinutesSinceMidnight % 60
    const endHours = (this.payload.endMinutesSinceMidnight - endMinutes) / 60

    return new StartAndEndTime({
      start: { hour: startHours, minute: startMinutes },
      end: { hour: endHours, minute: endMinutes },
    })
  }

  get presetName(): string {
    return this.payload.presetName
  }
}
