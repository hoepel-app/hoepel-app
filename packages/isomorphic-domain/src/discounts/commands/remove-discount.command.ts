import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  readonly discountName: string
}

export class RemoveDiscountCommand extends CommandBase<Payload> {
  name = 'remove-discount-command' as const

  static create(
    discountName: string,
    metadata: CommandMetadata
  ): RemoveDiscountCommand {
    return new RemoveDiscountCommand({ discountName }, metadata)
  }

  get discountName(): string {
    return this.payload.discountName
  }
}
