import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
import {
  Collection,
  FirestoreCollectionEvents,
  IEvent,
  store,
} from '@hoepel.app/types'
import * as admin from 'firebase-admin'

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
  beforeDoc?: any,
  afterDoc?: any
): string | undefined => {
  const collectionsWithTenantIds = Object.entries(store)
    .map(([key, collection]: [string, Collection<any>]) => collection)
    .filter(collection => collection.docIdIsTenantName)
    .map(collection => collection.collectionName)

  if (collectionsWithTenantIds.includes(collectionId)) {
    return collectionId
  } else if (collectionId === store.users.collectionName) {
    return 'global' // user document in this collection are global or may span tenants
  } else if (afterDoc && afterDoc.tenant) {
    return afterDoc.tenant
  } else if (beforeDoc && beforeDoc.tenant) {
    return beforeDoc.tenant
  } else {
    return undefined
  }
}

/**
 * For every Firestore collection, create a class that allows us to create common events
 */
const firestoreEventCreators: ReadonlyArray<FirestoreCollectionEvents<
  any
>> = Object.entries(store).map(
  ([field, collection]: [string, Collection<any>]) => {
    return new FirestoreCollectionEvents(collection)
  }
)

/**
 * Tries to extract identifiers for well-known object types from objects depending on the collection they were entered in
 */
const getContextIds = (
  collectionId: string,
  documentId: string,
  entity: any
): Context => {
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
  before: any,
  after: any
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
  change: functions.Change<DocumentSnapshot>
): IEvent<any> => {
  const before = change.before ? change.before.data() : undefined
  const after = change.after ? change.after.data() : undefined

  const tenant = getTenant(collectionId, before, after)

  if (!tenant) {
    throw new Error(
      `Could not get tenant for event! Document: ${collectionId}/${documentId}`
    )
  }

  const eventCreator = firestoreEventCreators.find(creator =>
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
  change: functions.Change<DocumentSnapshot>
): Promise<void> => {
  if (collectionId === 'events') {
    return Promise.resolve() // No infinite loops
  }

  const event = createEvent(type, collectionId, documentId, timestamp, change)

  if (event) {
    await db.collection('events').add(event)
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
