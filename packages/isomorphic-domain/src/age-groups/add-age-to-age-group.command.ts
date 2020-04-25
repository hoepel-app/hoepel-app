import { CommandMetadata, CommandBase } from '@hoepel.app/ddd-library'

type Payload = {
  ageGroupName: string
  age: number
}

export class AddAgeToAgeGroupCommand extends CommandBase<Payload> {
  name = 'add-age-to-age-group-command' as const

  static create(
    ageGroupName: string,
    age: number,
    commandMetadata: CommandMetadata
  ): AddAgeToAgeGroupCommand {
    return new AddAgeToAgeGroupCommand(
      {
        age,
        ageGroupName,
      },
      commandMetadata
    )
  }

  get age(): number {
    return this.payload.age
  }

  get ageGroupName(): string {
    return this.payload.ageGroupName
  }
}
