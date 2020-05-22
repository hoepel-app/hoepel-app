import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  presetName: string
  newLocation: string
}

export class ChangeShiftPresetLocationCommand extends CommandBase<Payload> {
  name = 'change-shift-preset-location-command' as const

  static create(
    presetName: string,
    newLocation: string,
    commandMetadata: CommandMetadata
  ): ChangeShiftPresetLocationCommand {
    return new ChangeShiftPresetLocationCommand(
      {
        newLocation,
        presetName,
      },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }

  get newLocation(): string {
    return this.payload.newLocation
  }
}
