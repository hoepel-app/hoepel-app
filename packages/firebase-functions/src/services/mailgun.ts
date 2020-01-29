import * as functions from 'firebase-functions'
import * as nodemailer from 'nodemailer'
import mailgunTransport from 'nodemailer-mailgun-transport'

const auth = {
  auth: {
    // eslint-disable-next-line @typescript-eslint/camelcase
    api_key: functions.config().mailgun.apikey,
    domain: functions.config().mailgun.domain,
  },
}

export const nodemailerMailgun = nodemailer.createTransport(
  mailgunTransport(auth)
)
