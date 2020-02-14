import admin from 'firebase-admin'
import { IEvent, CreateEvent, createEvent } from '@hoepel.app/events-framework'

type Name = 'firebase-auth-user-deleted'
type Data = admin.auth.UserRecord

export type FirebaseAuthUserDeleted = IEvent<Name, Data>

export const createFirebaseAuthUserDeletedEvent: CreateEvent<Name, Data> = (
  data,
  organisationId,
  user,
  timestamp
) =>
  createEvent(
    'firebase-auth-user-deleted',
    data,
    organisationId,
    user,
    timestamp
  )
