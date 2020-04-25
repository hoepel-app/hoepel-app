import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { AgeGroupProps, AgeGroup } from './age-group'

type Payload = { ageGroupProps: AgeGroupProps }

export class AddAgeGroupCommand extends CommandBase<Payload> {
  name = 'add-age-group-command' as const

  static create(
    ageGroup: AgeGroup,
    metadata: CommandMetadata
  ): AddAgeGroupCommand {
    return new AddAgeGroupCommand(
      { ageGroupProps: ageGroup.toProps() },
      metadata
    )
  }

  get ageGroup(): AgeGroup {
    return AgeGroup.fromProps(this.payload.ageGroupProps)
  }
}
