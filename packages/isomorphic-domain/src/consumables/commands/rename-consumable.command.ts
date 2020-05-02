import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'

type Payload = {
  readonly oldName: string
  readonly newName: string
}

export class RenameConsumableCommand extends CommandBase<Payload> {
  name = 'rename-consumable-command' as const

  static create(
    oldName: string,
    newName: string,
    metadata: CommandMetadata
  ): RenameConsumableCommand {
    return new RenameConsumableCommand({ oldName, newName }, metadata)
  }

  get oldName(): string {
    return this.payload.oldName
  }

  get newName(): string {
    return this.payload.newName
  }
}
