import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  presetName: string
  childrenCanAttend: boolean
}

export class ChangeChildrenCanAttendShiftPresetCommand extends CommandBase<
  Payload
> {
  name = 'change-children-can-attend-shift-preset-command' as const

  static create(
    presetName: string,
    childrenCanAttend: boolean,
    commandMetadata: CommandMetadata
  ): ChangeChildrenCanAttendShiftPresetCommand {
    return new ChangeChildrenCanAttendShiftPresetCommand(
      {
        childrenCanAttend,
        presetName,
      },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }

  get childrenCanAttend(): boolean {
    return this.payload.childrenCanAttend
  }
}
