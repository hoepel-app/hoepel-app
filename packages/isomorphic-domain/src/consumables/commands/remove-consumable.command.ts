import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  readonly consumableName: string
}

export class RemoveConsumableCommand extends CommandBase<Payload> {
  name = 'change-consumable-price-command' as const

  static create(
    consumableName: string,
    metadata: CommandMetadata
  ): RemoveConsumableCommand {
    return new RemoveConsumableCommand(
      {
        consumableName,
      },
      metadata
    )
  }

  get consumableName(): string {
    return this.payload.consumableName
  }
}
