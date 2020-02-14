import admin from 'firebase-admin'
import { createFirebaseAuthUserCreatedEvent } from './firebase-auth-user-created'

describe('createFirebaseAuthUserCreatedEvent', () => {
  it('create', () => {
    const userRecord = {
      uid: 'uid-here',
      disabled: false,
      emailVerified: true,
      providerData: [] as unknown[],
      metadata: {
        creationTime: new Date(1581268607573).toUTCString(),
        lastSignInTime: new Date(1581268607573).toUTCString(),
      },
    }

    const event = createFirebaseAuthUserCreatedEvent(
      userRecord as admin.auth.UserRecord,
      'global',
      {
        uid: 'uid-here',
        email: 'email@example.org',
      },
      new Date(1581268607573)
    )

    expect(event).toMatchInlineSnapshot(`
      Object {
        "name": "firebase-auth-user-created",
        "organisationId": "global",
        "payload": Object {
          "disabled": false,
          "emailVerified": true,
          "metadata": Object {
            "creationTime": "Sun, 09 Feb 2020 17:16:47 GMT",
            "lastSignInTime": "Sun, 09 Feb 2020 17:16:47 GMT",
          },
          "providerData": Array [],
          "uid": "uid-here",
        },
        "timestamp": 1581268607573,
        "triggeredBy": Object {
          "email": "email@example.org",
          "type": "user",
          "uid": "uid-here",
        },
      }
    `)
  })
})
