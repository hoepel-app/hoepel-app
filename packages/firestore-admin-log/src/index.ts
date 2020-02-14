import { Log, IEvent } from '@hoepel.app/events-framework'
import admin from 'firebase-admin'

export class FirestoreAdminLog implements Log {
  constructor(private collection: admin.firestore.CollectionReference) {}

  async commit(event: IEvent<string, any>): Promise<{ id: string }> {
    const data = await this.collection.add({
      name: event.name,
      organisationId: event.organisationId,
      payload: event.payload,
      timestamp: event.timestamp,
      triggeredBy: event.triggeredBy,
    })

    return { id: data.id }
  }
}
