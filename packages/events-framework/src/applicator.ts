import { IEvent, EventName } from './event'

/**
 * Applies an event with name NAME to a snapshot (projection) of type S. The payload of the event is of type T.
 */
export type Applicator<NAME extends EventName, T, S> = (
  snapshot: S,
  event: IEvent<NAME, T>
) => S
