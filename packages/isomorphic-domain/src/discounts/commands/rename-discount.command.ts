import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  readonly oldName: string
  readonly newName: string
}

export class RenameDiscountCommand extends CommandBase<Payload> {
  name = 'rename-discount-command' as const

  static create(
    oldName: string,
    newName: string,
    metadata: CommandMetadata
  ): RenameDiscountCommand {
    return new RenameDiscountCommand({ oldName, newName }, metadata)
  }

  get oldName(): string {
    return this.payload.oldName
  }

  get newName(): string {
    return this.payload.newName
  }
}
