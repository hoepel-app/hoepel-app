import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  presetName: string
  crewMembersCanAttend: boolean
}

export class ChangeCrewMembersCanAttendShiftPresetCommand extends CommandBase<
  Payload
> {
  name = 'change-crew-members-can-attend-shift-preset-command' as const

  static create(
    presetName: string,
    crewMembersCanAttend: boolean,
    commandMetadata: CommandMetadata
  ): ChangeCrewMembersCanAttendShiftPresetCommand {
    return new ChangeCrewMembersCanAttendShiftPresetCommand(
      {
        crewMembersCanAttend,
        presetName,
      },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }

  get crewMembersCanAttend(): boolean {
    return this.payload.crewMembersCanAttend
  }
}
