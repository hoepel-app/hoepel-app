import { IEvent } from '@hoepel.app/events-framework'
import { FirestoreAdminLog } from '.'
import * as firebase from '@firebase/testing'

const testApp = firebase.initializeTestApp({
  projectId: 'firestore-admin-log-test-app',
})

describe('Firestore event log (admin API)', () => {
  it('add event', async () => {
    const firestore = testApp.firestore()
    const collection = firestore.collection('my-events-collection')
    const myEvent: IEvent<
      'my-event-name',
      { someName: string; count: number }
    > = {
      name: 'my-event-name',
      organisationId: 'my-organisation',
      payload: {
        count: 2,
        someName: 'some value',
      },
      timestamp: 1581280237464,
      triggeredBy: {
        type: 'user',
        email: 'myname@example.org',
        uid: 'this-is-my-user-id',
      },
    }

    const log = new FirestoreAdminLog(collection as any)
    const { id } = await log.commit(myEvent)

    expect(id).not.toBeNull()

    const allDocuments = await collection.get()

    expect(allDocuments.docs).toHaveLength(1)
    expect(allDocuments.docs[0].data()).toMatchInlineSnapshot(`
      Object {
        "name": "my-event-name",
        "organisationId": "my-organisation",
        "payload": Object {
          "count": 2,
          "someName": "some value",
        },
        "timestamp": 1581280237464,
        "triggeredBy": Object {
          "email": "myname@example.org",
          "type": "user",
          "uid": "this-is-my-user-id",
        },
      }
    `)

    await testApp.delete()
  })
})
