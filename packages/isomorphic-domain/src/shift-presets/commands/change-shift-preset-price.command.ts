import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { Price } from '@hoepel.app/types'

type Payload = {
  presetName: string
  newPriceCents: number
}

export class ChangeShiftPresetPriceCommand extends CommandBase<Payload> {
  name = 'change-shift-preset-price-command' as const

  static create(
    presetName: string,
    newPrice: Price,
    commandMetadata: CommandMetadata
  ): ChangeShiftPresetPriceCommand {
    return new ChangeShiftPresetPriceCommand(
      { presetName, newPriceCents: newPrice.totalCents },
      commandMetadata
    )
  }

  get presetName(): string {
    return this.payload.presetName
  }

  get newPrice(): Price {
    return Price.fromCents(this.payload.newPriceCents)
  }
}
