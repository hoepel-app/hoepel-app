import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Init firebase app
admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

export * from '@hoepel.app/firestore-events'
export * from './user-events/'
export * from './pubsub-events/'

export * from './api'
