import * as functions from 'firebase-functions'
import { nodemailerMailgun } from '../services/mailgun'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const onUserCreatedSendMail = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async user => {
    await nodemailerMailgun.sendMail({
      from: 'noreply@mail.hoepel.app',
      to: 'thomas@toye.io',
      subject: `Nieuwe persoon geregistreerd: ${user.displayName ||
        user.email}`,
      replyTo: 'help@hoepel.app',
      text: `Een nieuwe persoon heeft zich geregistreerd. Naam: ${user.displayName ||
        '<geen naam>'}, contact: ${user.email}. Details als bijlage.`,
      attachments: [
        {
          content: JSON.stringify(user, null, 2),
          filename: 'user-record.txt',
        },
      ],
    })
  })

export const onUserCreatedSaveUserDocument = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async user => {
    await db
      .collection('users')
      .doc(user.uid)
      .set(
        {
          displayName: user.displayName || null,
          email: user.email,
        },
        { merge: true }
      )

    return {}
  })
