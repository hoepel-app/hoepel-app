import { Command } from '../command/command'

export type AddAgeToAgeGroupCommandProps = {
  tenantId: string
  ageGroupName: string
  age: number
}

export class AddAgeToAgeGroupCommand
  implements Command<AddAgeToAgeGroupCommandProps> {
  name = 'add-age-to-age-group-command' as const

  private constructor(private readonly props: AddAgeToAgeGroupCommandProps) {}

  static create(
    tenantId: string,
    ageGroupName: string,
    age: number
  ): AddAgeToAgeGroupCommand {
    return new AddAgeToAgeGroupCommand({
      tenantId,
      age,
      ageGroupName,
    })
  }

  toProps(): AddAgeToAgeGroupCommandProps {
    return this.props
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get ageGroupName(): string {
    return this.props.ageGroupName
  }

  get age(): number {
    return this.props.age
  }
}
