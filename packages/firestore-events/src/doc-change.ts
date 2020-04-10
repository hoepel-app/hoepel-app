import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Collection, store } from '@hoepel.app/types'
import { FirestoreCollectionEvents, IEvent } from '@hoepel.app/old-events'
import { FIRESTORE_EVENTS_COLLECTION } from './constants'

type DocumentSnapshot = admin.firestore.DocumentSnapshot

const db = admin.firestore()

type Context = {
  shiftId?: string
  childId?: string
  crewId?: string
  contactPersonId?: string
}

/**
 * Get the name of the tenant
 */
const getTenant = (
  collectionId: string,
  beforeDoc?: unknown,
  afterDoc?: unknown
): string | undefined => {
  const collectionsWithTenantIds = Object.entries(store)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(
      ([key, collection]: [
        string,
        Collection<{ readonly [key: string]: unknown }>
      ]) => collection
    )
    .filter((collection) => collection.docIdIsTenantName)
    .map((collection) => collection.collectionName)

  if (collectionsWithTenantIds.includes(collectionId)) {
    return collectionId
  } else if (collectionId === store.users.collectionName) {
    return 'global' // user document in this collection are global or may span tenants
  } else if (afterDoc && hasTenantField(afterDoc)) {
    return afterDoc.tenant
  } else if (beforeDoc && hasTenantField(beforeDoc)) {
    return beforeDoc.tenant
  } else {
    return undefined
  }
}

/**
 * For every Firestore collection, create a class that allows us to create common events
 */
const firestoreEventCreators: ReadonlyArray<FirestoreCollectionEvents<
  unknown
>> = Object.entries(store).map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ([field, collection]: [
    string,
    Collection<{ readonly [key: string]: unknown }>
  ]) => new FirestoreCollectionEvents(collection)
)

/**
 * Tries to extract identifiers for well-known object types from objects depending on the collection they were entered in
 */
const getContextIds = (
  collectionId: string,
  documentId: string,
  entity: { childId?: string; shiftId?: string; crewId?: string } | undefined
): Context => {
  if (entity == null) {
    return {}
  }

  switch (collectionId) {
    case store.childAttendanceAdd.collectionName:
    case store.childAttendanceDelete.collectionName:
      return { childId: entity.childId, shiftId: entity.shiftId }
    case store.children.collectionName:
      return { childId: documentId }
    case store.contactPeople.collectionName:
      return { contactPersonId: documentId }
    case store.crewAttendancesAdd.collectionName:
    case store.crewAttendancesDelete.collectionName:
      return { crewId: entity.crewId, shiftId: entity.shiftId }
    case store.crewMembers.collectionName:
      return { crewId: documentId }
    case store.shifts.collectionName:
      return { shiftId: documentId }
    default:
      return {}
  }
}

/**
 * Try to extract context identifiers, depending on the operation type
 */
const getContextIdsForEvent = (
  type: 'updated' | 'created' | 'deleted',
  collectionId: string,
  documentId: string,
  before: { [key: string]: unknown } | undefined,
  after: { [key: string]: unknown } | undefined
): Context => {
  switch (type) {
    case 'created':
      return getContextIds(collectionId, documentId, after)
    case 'deleted':
      return getContextIds(collectionId, documentId, before)
    case 'updated':
      return {
        ...getContextIds(collectionId, documentId, before),
        ...getContextIds(collectionId, documentId, after),
      }
  }
}

/**
 * Create an event based on Firestore document changes
 */
const createEvent = (
  type: 'updated' | 'created' | 'deleted',
  collectionId: string,
  documentId: string,
  timestamp: string,
  change: functions.Change<DocumentSnapshot | undefined>
): IEvent<unknown> | null => {
  const before = change.before ? change.before.data() : undefined
  const after = change.after ? change.after.data() : undefined

  const tenant = getTenant(collectionId, before, after)

  if (!tenant) {
    throw new Error(
      `Could not get tenant for event! Document: ${collectionId}/${documentId}`
    )
  }

  const eventCreator = firestoreEventCreators.find((creator) =>
    creator.isAppropriateFor(collectionId)
  )

  if (eventCreator) {
    switch (type) {
      case 'created':
        return eventCreator.created(
          documentId,
          after,
          {
            tenant,
            ...getContextIdsForEvent(
              type,
              collectionId,
              documentId,
              before,
              after
            ),
          },
          new Date(timestamp)
        )

      case 'updated':
        return eventCreator.updated(
          documentId,
          before,
          after,
          {
            tenant,
            ...getContextIdsForEvent(
              type,
              collectionId,
              documentId,
              before,
              after
            ),
          },
          new Date(timestamp)
        )

      case 'deleted':
        return eventCreator.deleted(
          documentId,
          before,
          {
            tenant,
            ...getContextIdsForEvent(
              type,
              collectionId,
              documentId,
              before,
              after
            ),
          },
          new Date(timestamp)
        )

      default:
        throw new Error(`Unrecognized Firestore event type ${type}`)
    }
  } else {
    return null
  }
}

/**
 * Create and store an event when a Firestore document changes
 */
const handleDocumentChange = async (
  type: 'updated' | 'created' | 'deleted',
  collectionId: string,
  documentId: string,
  timestamp: string,
  change: functions.Change<DocumentSnapshot | undefined>
): Promise<void> => {
  if (
    collectionId === FIRESTORE_EVENTS_COLLECTION ||
    collectionId === 'events'
  ) {
    // TODO 'events' is used by user creation/deletion/... events
    return Promise.resolve() // No infinite loops
  }

  const event = createEvent(type, collectionId, documentId, timestamp, change)

  if (event) {
    await db.collection(FIRESTORE_EVENTS_COLLECTION).add(event)
  } else {
    throw new Error(
      `Could not create an event for ${collectionId}/${documentId} (operation: ${type})!`
    )
  }
}

export const onDocumentUpdate = functions
  .region('europe-west1')
  .firestore.document('{collectionId}/{documentId}')
  .onUpdate(async (snap, context) => {
    await handleDocumentChange(
      'updated',
      context.params.collectionId,
      context.params.documentId,
      context.timestamp,
      snap
    )
  })

export const onDocumentDelete = functions
  .region('europe-west1')
  .firestore.document('{collectionId}/{documentId}')
  .onDelete(async (snap, context) => {
    await handleDocumentChange(
      'deleted',
      context.params.collectionId,
      context.params.documentId,
      context.timestamp,
      new functions.Change(snap, undefined)
    )
  })

export const onDocumentCreate = functions
  .region('europe-west1')
  .firestore.document('{collectionId}/{documentId}')
  .onCreate(async (snap, context) => {
    await handleDocumentChange(
      'created',
      context.params.collectionId,
      context.params.documentId,
      context.timestamp,
      new functions.Change(undefined, snap)
    )
  })

const hasTenantField = (value: unknown): value is { tenant: string } => {
  return (
    typeof value === 'object' && (value as { tenant?: string }).tenant != null
  )
}
