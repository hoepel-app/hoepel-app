import { Collection } from '@hoepel.app/types'
import { IEvent, IEventContext } from './event'

export class FirestoreCollectionEvents<T> {
  constructor(private collection: Collection<T>) {}

  isAppropriateFor(collectionId: string): boolean {
    return this.collection.collectionName === collectionId
  }

  created(
    id: string,
    entity: T,
    context: IEventContext,
    timestamp: Date
  ): IEvent<T> {
    return {
      type: 'created',
      firestore: {
        collectionId: this.collection.collectionName,
        after: entity,
        documentId: id,
      },
      name: this.collection.eventPrefix + '-created',
      resource: 'firestore',
      context: { ...context, documentId: id },
      timestamp: timestamp.getTime(),
    }
  }

  updated(
    id: string,
    before: T,
    after: T,
    context: IEventContext,
    timestamp: Date
  ): IEvent<T> {
    return {
      type: 'updated',
      firestore: {
        collectionId: this.collection.collectionName,
        before,
        after,
        documentId: id,
      },
      name: this.collection.eventPrefix + '-updated',
      resource: 'firestore',
      context: { ...context, documentId: id },
      timestamp: timestamp.getTime(),
    }
  }

  deleted(
    id: string,
    deletedEntity: T,
    context: IEventContext,
    timestamp: Date
  ): IEvent<T> {
    return {
      type: 'deleted',
      firestore: {
        collectionId: this.collection.collectionName,
        before: deletedEntity,
        documentId: id,
      },
      name: this.collection.eventPrefix + '-deleted',
      resource: 'firestore',
      context: { ...context, documentId: id },
      timestamp: timestamp.getTime(),
    }
  }
}
