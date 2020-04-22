import { Command } from '../command/command'

export type ChangeAgeGroupNameCommandProps = {
  tenantId: string
  ageGroupCurrentName: string
  ageGroupNewName: string
}

export class ChangeAgeGroupNameCommand
  implements Command<ChangeAgeGroupNameCommandProps> {
  name = 'change-age-group-name-command' as const

  private constructor(private readonly props: ChangeAgeGroupNameCommandProps) {}

  static create(
    tenantId: string,
    ageGroupCurrentName: string,
    ageGroupNewName: string
  ): ChangeAgeGroupNameCommand {
    return new ChangeAgeGroupNameCommand({
      tenantId,
      ageGroupCurrentName,
      ageGroupNewName,
    })
  }

  toProps(): ChangeAgeGroupNameCommandProps {
    return this.props
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get ageGroupCurrentName(): string {
    return this.props.ageGroupCurrentName
  }

  get ageGroupNewName(): string {
    return this.props.ageGroupNewName
  }
}
