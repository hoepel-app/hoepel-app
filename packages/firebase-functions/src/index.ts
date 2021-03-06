import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Init firebase app
admin.initializeApp(functions.config().firebase) // TODO this config key is undefined?
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

export * from '@hoepel.app/firestore-events'
export * from './user-events/'
export { onCloudBuildPubsub } from '@hoepel.app/cloud-build-notifier'

export { api } from './api'
