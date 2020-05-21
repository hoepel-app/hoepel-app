import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  presetName: string
}

export class RemoveShiftPresetCommand extends CommandBase<Payload> {
  name = 'remove-shift-preset-command' as const

  static create(
    presetName: string,
    commandMetadata: CommandMetadata
  ): RemoveShiftPresetCommand {
    return new RemoveShiftPresetCommand(
      {
        presetName,
      },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }
}
