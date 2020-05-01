import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { Price } from '@hoepel.app/types'

type Payload = {
  readonly consumableName: string
  readonly priceCents: number
}

export class ChangeConsumablePriceCommand extends CommandBase<Payload> {
  name = 'change-consumable-price-command' as const

  static create(
    consumableName: string,
    priceCents: number,
    metadata: CommandMetadata
  ): ChangeConsumablePriceCommand {
    if (priceCents < 0) {
      throw new Error('Cannot create price with negative cents')
    }

    if (Math.round(priceCents) !== priceCents) {
      throw new Error('Price in cents should be an integer')
    }

    return new ChangeConsumablePriceCommand(
      { consumableName, priceCents },
      metadata
    )
  }

  get price(): Price {
    return Price.fromCents(this.payload.priceCents)
  }

  get consumableName(): string {
    return this.payload.consumableName
  }
}
