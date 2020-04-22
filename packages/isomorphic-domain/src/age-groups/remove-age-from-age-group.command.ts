import { Command } from '../command/command'

export type RemoveAgeFromAgeGroupCommandProps = {
  tenantId: string
  ageGroupName: string
  age: number
}

export class RemoveAgeFromAgeGroupCommand
  implements Command<RemoveAgeFromAgeGroupCommandProps> {
  name = 'remove-age-from-age-group-command' as const

  private constructor(
    private readonly props: RemoveAgeFromAgeGroupCommandProps
  ) {}

  static create(
    tenantId: string,
    ageGroupName: string,
    age: number
  ): RemoveAgeFromAgeGroupCommand {
    return new RemoveAgeFromAgeGroupCommand({
      tenantId,
      age,
      ageGroupName,
    })
  }

  toProps(): RemoveAgeFromAgeGroupCommandProps {
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
