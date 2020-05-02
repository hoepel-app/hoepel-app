import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  ageGroupCurrentName: string
  ageGroupNewName: string
}

export class RenameAgeGroupCommand extends CommandBase<Payload> {
  name = 'rename-age-group-command' as const

  static create(
    ageGroupCurrentName: string,
    ageGroupNewName: string,
    commandMetadata: CommandMetadata
  ): RenameAgeGroupCommand {
    return new RenameAgeGroupCommand(
      {
        ageGroupCurrentName,
        ageGroupNewName,
      },
      commandMetadata
    )
  }

  get ageGroupCurrentName(): string {
    return this.payload.ageGroupCurrentName
  }

  get ageGroupNewName(): string {
    return this.payload.ageGroupNewName
  }
}
