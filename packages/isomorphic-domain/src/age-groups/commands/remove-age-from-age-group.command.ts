import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  ageGroupName: string
  age: number
}

export class RemoveAgeFromAgeGroupCommand extends CommandBase<Payload> {
  name = 'remove-age-from-age-group-command' as const

  static create(
    ageGroupName: string,
    age: number,
    commandMetadata: CommandMetadata
  ): RemoveAgeFromAgeGroupCommand {
    return new RemoveAgeFromAgeGroupCommand(
      {
        age,
        ageGroupName,
      },
      commandMetadata
    )
  }

  get ageGroupName(): string {
    return this.payload.ageGroupName
  }

  get age(): number {
    return this.payload.age
  }
}
