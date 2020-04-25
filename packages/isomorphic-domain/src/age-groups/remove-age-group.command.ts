import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  ageGroupName: string
}

export class RemoveAgeGroupCommand extends CommandBase<Payload> {
  name = 'remove-age-group-command' as const

  static create(
    ageGroupName: string,
    commandMetadata: CommandMetadata
  ): RemoveAgeGroupCommand {
    return new RemoveAgeGroupCommand(
      {
        ageGroupName,
      },
      commandMetadata
    )
  }

  get ageGroupName(): string {
    return this.payload.ageGroupName
  }
}
