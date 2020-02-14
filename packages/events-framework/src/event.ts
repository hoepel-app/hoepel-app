import { OrganisationId } from './organisation-id'

type TriggeredByUser = {
  type: 'user'
  uid: string
  email: string
}

/**
 * We could have a union of all event names, that would allow the type system to discriminate events
 * However, that way we don't handle unknown events
 * It would also require us to define all events in this package
 */
export type EventName = string

export type IEvent<NAME extends EventName, T> = {
  /** Milliseconds since UNIX epoch */
  readonly timestamp: number

  /** Either id of the organisation or "global", referring to global events */
  readonly organisationId: OrganisationId

  /** Event name */
  readonly name: NAME

  readonly payload: T

  readonly triggeredBy: TriggeredByUser
}
