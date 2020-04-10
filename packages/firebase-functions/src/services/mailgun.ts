import * as functions from 'firebase-functions'
import mg from 'mailgun-js'

const auth = {
  apiKey: functions.config().mailgun.apikey,
  domain: functions.config().mailgun.domain,
} as const

const mailgun = mg(auth)

type Mail = {
  to: string
  subject: string
  text: string
  attachments: readonly { content: string; filename: string }[]
}

type NotifyAdminPayload = {
  subject: string
  text: string
  attachments: readonly { content: string; filename: string }[]
}

export const mail = async (mail: Mail): Promise<void> => {
  const attachments = mail.attachments.map(
    att =>
      new mailgun.Attachment({
        data: Buffer.from(att.content, 'utf-8'),
        filename: att.filename,
      })
  )

  await mailgun.messages().send({
    to: mail.to,
    'h:Reply-To': 'hoepel.app help <help@hoepel.app>',
    from: 'noreply@mail.hoepel.app',
    text: mail.text,
    subject: mail.subject,
    attachment: attachments,
  })
}

export const notifyAdmin = (args: NotifyAdminPayload): Promise<void> =>
  mail({
    ...args,
    to: 'thomas@toye.io',
  })
