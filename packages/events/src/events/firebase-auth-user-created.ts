import admin from 'firebase-admin'
import { IEvent, CreateEvent, createEvent } from '@hoepel.app/events-framework'

type Name = 'firebase-auth-user-created'
type Data = admin.auth.UserRecord

export type FirebaseAuthUserCreated = IEvent<Name, Data>

export const createFirebaseAuthUserCreatedEvent: CreateEvent<Name, Data> = (
  data,
  organisationId,
  user,
  timestamp
) =>
  createEvent(
    'firebase-auth-user-created',
    data,
    organisationId,
    user,
    timestamp
  )
