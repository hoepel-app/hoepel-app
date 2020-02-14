import { EventName, IEvent } from './event'
import { OrganisationId } from './organisation-id'

type UserInfo = { uid: string; email: string }

/**Type of a function that creates an event with payload of type T */
export type CreateEvent<NAME extends EventName, T> = (
  data: T,
  organisationId: string,
  user: UserInfo,
  timestamp: Date
) => IEvent<NAME, T>

/** Helper to create an event with payload of type T */
export const createEvent = <NAME extends EventName, T>(
  name: NAME,
  payload: T,
  organisationId: OrganisationId,
  user: UserInfo,
  timestamp: Date
): IEvent<NAME, T> => {
  if (
    name == null ||
    payload == null ||
    organisationId == null ||
    organisationId == '' ||
    timestamp == null ||
    user == null
  ) {
    throw new Error(
      `Could not create event '${name}' for organisation '${organisationId}' with value ${JSON.stringify(
        payload
      )} and timestamp ${timestamp.toUTCString()}, triggered by user ${JSON.stringify(
        user
      )}`
    )
  }

  return {
    timestamp: timestampToMs(timestamp),
    organisationId,
    name,
    payload: JSON.parse(JSON.stringify(payload)),
    triggeredBy: {
      type: 'user',
      uid: user.uid,
      email: user.email,
    },
  }
}

/** Helper to convert a Date to a timestamp in milliseconds */
const timestampToMs = (timestamp: Date): number => {
  return timestamp.getTime()
}
