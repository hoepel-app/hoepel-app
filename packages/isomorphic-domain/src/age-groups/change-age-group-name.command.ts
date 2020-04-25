import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  ageGroupCurrentName: string
  ageGroupNewName: string
}

export class ChangeAgeGroupNameCommand extends CommandBase<Payload> {
  name = 'change-age-group-name-command' as const

  static create(
    ageGroupCurrentName: string,
    ageGroupNewName: string,
    commandMetadata: CommandMetadata
  ): ChangeAgeGroupNameCommand {
    return new ChangeAgeGroupNameCommand(
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
