import { Message } from './message'

export type EventName = string

export type IEvent<NAME extends EventName, T> = {
  readonly aggregateId: string

  /** Event name */
  readonly name: NAME
} & Message<T>

export type EventPublisher = {
  publish<T extends IEvent<EventName, unknown>>(event: T): Promise<void>
}
