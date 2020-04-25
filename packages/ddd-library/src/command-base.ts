import { CommandRequestedBy, Command } from './command'

export type CommandMetadata = {
  commandId: string
  correlationId?: string
  requestedBy: CommandRequestedBy
  timestamp?: Date
  tenantId: string
}

export abstract class CommandBase<T> implements Command<T> {
  protected _timestamp: Date

  protected constructor(
    protected _payload: T,
    protected _commandMetadata: CommandMetadata
  ) {
    this._timestamp = _commandMetadata.timestamp ?? new Date()
  }

  abstract name: string

  toProps(): T {
    return this._payload
  }

  get payload(): T {
    return this._payload
  }

  get correlationId(): string {
    return (
      this._commandMetadata.correlationId ?? this._commandMetadata.commandId
    )
  }

  get id(): string {
    return this._commandMetadata.commandId
  }

  get requestedBy(): CommandRequestedBy {
    return this._commandMetadata.requestedBy
  }

  get timestamp(): number {
    return this._timestamp.getTime()
  }

  get tenantId(): string {
    return this._commandMetadata.tenantId
  }
}
