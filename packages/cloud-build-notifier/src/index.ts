import { handleMessage } from './handle-message'
import * as functions from 'firebase-functions'
import { webhook } from './slack-webhook'

export const onCloudBuildPubsub = functions
  .region('europe-west1')
  .pubsub.topic('cloud-builds')
  .onPublish(message => handleMessage(message, webhook))
