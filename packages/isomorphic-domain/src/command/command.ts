export type CommandRejected = { status: 'rejected' }
export type CommandAccepted = { status: 'accepted' }
export type CommandResult = CommandAccepted | CommandRejected

export type Command<T> = {
  name: string
  toProps(): T
}
