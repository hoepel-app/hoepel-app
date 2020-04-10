import * as functions from 'firebase-functions'
import { IncomingWebhookSendArguments, IncomingWebhook } from '@slack/webhook'

type Build = {
  status:
    | string
    | 'SUCCESS'
    | 'FAILURE'
    | 'INTERNAL_ERROR'
    | 'TIMEOUT'
    | 'QUEUED'
    | 'WORKING'
    | 'CANCELLED'
  id: string
  logUrl: string
  finishTime: number
  startTime: number
  images?: string[]
}

const eventToBuild = (data: string): Build => {
  return JSON.parse(Buffer.from(data, 'base64').toString())
}

const createSlackMessage = (build: Build): IncomingWebhookSendArguments => {
  const message = {
    text: `Build \`${build.id}\` (${build.status.toLocaleLowerCase()})`,
    mrkdwn: true,
    attachments: [
      {
        title: 'Build logs',
        // eslint-disable-next-line @typescript-eslint/camelcase
        title_link: build.logUrl,
        fields: [
          {
            title: 'Status',
            value: build.status,
          },
        ],
      },
    ],
  }
  return message
}

export const handleMessage = async (
  message: functions.pubsub.Message,
  webhook: IncomingWebhook
): Promise<void> => {
  const build = eventToBuild(message.data)

  const interestingStatus = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT']

  if (!interestingStatus.includes(build.status)) {
    return Promise.resolve()
  }

  await webhook.send(createSlackMessage(build))
}
