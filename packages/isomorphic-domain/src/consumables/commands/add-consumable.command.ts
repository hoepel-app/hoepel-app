import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { ConsumableProps, Consumable } from '../consumables'

type Payload = {
  readonly consumableProps: ConsumableProps
}

export class AddConsumableCommand extends CommandBase<Payload> {
  name = 'add-consumable-command' as const

  static create(
    consumable: Consumable,
    metadata: CommandMetadata
  ): AddConsumableCommand {
    return new AddConsumableCommand(
      { consumableProps: consumable.toProps() },
      metadata
    )
  }

  get consumable(): Consumable {
    return Consumable.fromProps(this.payload.consumableProps)
  }
}
