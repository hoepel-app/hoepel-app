import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import backupfireAgent from '@backupfire/firebase'

// Init firebase app
admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

export * from '@hoepel.app/firestore-events'
export * from './user-events/'
export { onCloudBuildPubsub } from '@hoepel.app/cloud-build-notifier'

export const backupfire = backupfireAgent()

export * from './api'
