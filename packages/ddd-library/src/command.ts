import { Message } from './message'

export type CommandRequestedBy = {
  type: 'user'
  uid: string
  email: string
}

export type CommandRejected = { status: 'rejected' }
export type CommandAccepted = { status: 'accepted' }
export type CommandResult = CommandAccepted | CommandRejected

export type Command<T> = {
  /** @deprecated */
  toProps(): T

  requestedBy: CommandRequestedBy
} & Message<T>
