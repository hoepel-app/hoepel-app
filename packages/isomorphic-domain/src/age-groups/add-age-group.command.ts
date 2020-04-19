import { Command } from '../command/command'
import { AgeGroupProps, AgeGroup } from './age-group'

export type AddAgeGroupCommandProps = {
  tenantId: string
  ageGroupProps: AgeGroupProps
}

export class AddAgeGroupCommand implements Command<AddAgeGroupCommandProps> {
  private constructor(private readonly props: AddAgeGroupCommandProps) {}

  static create(tenantId: string, ageGroup: AgeGroup): AddAgeGroupCommand {
    return new AddAgeGroupCommand({
      tenantId,
      ageGroupProps: ageGroup.toProps(),
    })
  }

  toProps(): AddAgeGroupCommandProps {
    return this.props
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get ageGroup(): AgeGroup {
    return AgeGroup.fromProps(this.props.ageGroupProps)
  }
}
