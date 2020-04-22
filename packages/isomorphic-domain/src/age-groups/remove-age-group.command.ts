import { Command } from '../command/command'

export type RemoveAgeGroupCommandProps = {
  tenantId: string
  ageGroupName: string
}

export class RemoveAgeGroupCommand
  implements Command<RemoveAgeGroupCommandProps> {
  name = 'remove-age-group-command' as const

  private constructor(private readonly props: RemoveAgeGroupCommandProps) {}

  static create(tenantId: string, ageGroupName: string): RemoveAgeGroupCommand {
    return new RemoveAgeGroupCommand({
      tenantId,
      ageGroupName,
    })
  }

  toProps(): RemoveAgeGroupCommandProps {
    return this.props
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get ageGroupName(): string {
    return this.props.ageGroupName
  }
}
