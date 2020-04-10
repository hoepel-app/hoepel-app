import { IncomingWebhook } from '@slack/webhook'
import * as functions from 'firebase-functions'

// Send Slack message on build events
// Based on https://cloud.google.com/cloud-build/docs/configure-third-party-notifications

const SLACK_WEBHOOK_URL = functions.config().cloudbuild.slackwebhook

export const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)
