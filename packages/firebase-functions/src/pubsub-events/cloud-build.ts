import * as functions from 'firebase-functions'
import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/client'

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

// Send Slack message on build events
// Based on https://cloud.google.com/cloud-build/docs/configure-third-party-notifications

const SLACK_WEBHOOK_URL = functions.config().cloudbuild.slackwebhook

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)

const eventToBuild = (data: string): Build => {
  return JSON.parse(new Buffer(data, 'base64').toString())
}

const createSlackMessage = (build: Build): IncomingWebhookSendArguments => {
  const message = {
    text: `Build \`${build.id}\` (${build.status.toLocaleLowerCase})`,
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

export const onCloudBuildPubsub = functions
  .region('europe-west1')
  .pubsub.topic('cloud-builds')
  .onPublish((message, context) => {
    const build = eventToBuild(message.data)

    const interestingStatus = [
      'SUCCESS',
      'FAILURE',
      'INTERNAL_ERROR',
      'TIMEOUT',
    ]

    if (!interestingStatus.includes(build.status)) {
      return Promise.resolve()
    }

    return webhook.send(createSlackMessage(build))
  })
