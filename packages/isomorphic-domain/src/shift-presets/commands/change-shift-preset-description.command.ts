import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  presetName: string
  newDescription: string
}

export class ChangeShiftPresetDescriptionCommand extends CommandBase<Payload> {
  name = 'change-shift-preset-description-command' as const

  static create(
    presetName: string,
    newDescription: string,
    commandMetadata: CommandMetadata
  ): ChangeShiftPresetDescriptionCommand {
    return new ChangeShiftPresetDescriptionCommand(
      {
        newDescription,
        presetName,
      },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }

  get newDescription(): string {
    return this.payload.newDescription
  }
}
