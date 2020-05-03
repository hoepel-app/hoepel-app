import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { DiscountProps, Discount } from '../discount'

type Payload = {
  readonly discountProps: DiscountProps
}

export class AddDiscountCommand extends CommandBase<Payload> {
  name = 'add-discount-command' as const

  static create(
    discount: Discount,
    metadata: CommandMetadata
  ): AddDiscountCommand {
    return new AddDiscountCommand(
      { discountProps: discount.toProps() },
      metadata
    )
  }

  get discount(): Discount {
    return Discount.fromProps(this.payload.discountProps)
  }
}
