import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  oldName: string
  newName: string
}

export class RenameShiftPresetCommand extends CommandBase<Payload> {
  name = 'rename-shift-preset-command' as const

  static create(
    oldName: string,
    newName: string,
    commandMetadata: CommandMetadata
  ): RenameShiftPresetCommand {
    return new RenameShiftPresetCommand(
      {
        oldName,
        newName,
      },
      commandMetadata
    )
  }

  get oldName(): string {
    return this.payload.oldName
  }

  get newName(): string {
    return this.payload.newName
  }
}
