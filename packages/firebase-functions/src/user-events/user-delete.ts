import * as functions from 'firebase-functions'
import { notifyAdmin } from '../services/mailgun'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const onUserDeletedSendMailAndDeleteDoc = functions
  .region('europe-west1')
  .auth.user()
  .onDelete(async user => {
    console.log(`Deleting ${user.uid}`)

    const userDoc = await db
      .collection('users')
      .doc(user.uid)
      .get()
    const tenantDocs = await db
      .collection('users')
      .doc(user.uid)
      .collection('tenants')
      .get()

    await notifyAdmin({
      subject: `Persoon verwijderd: ${user.displayName || user.email}`,
      text: `Een persoon heeft zijn/haar account verwijderd. Naam: ${user.displayName ||
        '<geen naam>'}, contact: ${
        user.email
      }. Details als bijlage. Verwijder de gebruiker en sporen daarvan.`,
      attachments: [
        {
          content: JSON.stringify(user, null, 2),
          filename: 'user-record.txt',
        },
        {
          content: JSON.stringify(
            {
              userDoc: userDoc.data(),
              tenantDocs: tenantDocs.docs.map(doc => {
                return { doc: doc.data(), tenant: doc.id }
              }),
            },
            null,
            2
          ),
          filename: 'firestore-data.txt',
        },
      ],
    })

    await Promise.all(tenantDocs.docs.map(doc => doc.ref.delete()))
    await userDoc.ref.delete()
  })
