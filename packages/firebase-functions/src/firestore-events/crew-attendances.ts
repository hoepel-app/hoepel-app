import * as functions from 'firebase-functions'
import admin from 'firebase-admin'
import {
  CrewAttendanceAddDoc,
  IDetailedCrewAttendance,
} from '@hoepel.app/types'

const db = admin.firestore()

export const onCrewAttendanceCreate = functions
  .region('europe-west1')
  .firestore.document('crew-attendances-add/{docId}')
  .onCreate(async (snap, context) => {
    const value = snap.data() as CrewAttendanceAddDoc & { tenant: string }

    const crewId = value.crewId
    const shiftId = value.shiftId
    const tenant = value.tenant
    const details = value.doc

    await db
      .collection('crew-attendances-by-shift')
      .doc(shiftId)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (doc.data().tenant === tenant) {
            const update: { [key: string]: IDetailedCrewAttendance } = {}
            update['attendances.' + crewId] = details
            db.collection('crew-attendances-by-shift')
              .doc(shiftId)
              .update(update)
          } else {
            console.error(
              'Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', update doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          const byShift: { [key: string]: IDetailedCrewAttendance } = {}
          byShift[crewId] = details

          db.collection('crew-attendances-by-shift')
            .doc(shiftId)
            .set({ tenant, attendances: byShift })
        }
      })

    await db
      .collection('crew-attendances-by-crew')
      .doc(crewId)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (doc.data().tenant === tenant) {
            const update: { [key: string]: IDetailedCrewAttendance } = {}
            update['attendances.' + shiftId] = details
            db.collection('crew-attendances-by-crew')
              .doc(crewId)
              .update(update)
          } else {
            console.error(
              'Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', update doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          const byCrew: { [key: string]: IDetailedCrewAttendance } = {}
          byCrew[shiftId] = details

          db.collection('crew-attendances-by-crew')
            .doc(crewId)
            .set({ tenant, attendances: byCrew })
        }
      })

    await db
      .collection('crew-attendances-add')
      .doc(context.params.docId)
      .delete()

    return true
  })

export const onCrewAttendanceDelete = functions
  .region('europe-west1')
  .firestore.document('crew-attendances-delete/{docId}')
  .onCreate(async (snap, context) => {
    const value = snap.data()

    const crewId = value.crewId
    const shiftId = value.shiftId
    const tenant = value.tenant

    await db
      .collection('crew-attendances-by-shift')
      .doc(shiftId)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (doc.data().tenant === tenant) {
            const update = doc.data()
            delete update.attendances[crewId]
            db.collection('crew-attendances-by-shift')
              .doc(shiftId)
              .set(update)
          } else {
            console.error(
              'Tried to update a crew attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', delete doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          console.error(
            'Tried to delete a non-existant crew attendance. Delete document: ' +
              JSON.stringify(value)
          )
        }
      })

    await db
      .collection('crew-attendances-by-crew')
      .doc(crewId)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (doc.data().tenant === tenant) {
            const update = doc.data()
            delete update.attendances[shiftId]
            db.collection('crew-attendances-by-crew')
              .doc(crewId)
              .set(update)
          } else {
            console.error(
              'Tried to set a crew attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', delete doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          console.error(
            'Tried to delete a non-existant crew attendance. Delete document: ' +
              JSON.stringify(value)
          )
        }
      })

    await db
      .collection('crew-attendances-delete')
      .doc(context.params.docId)
      .delete()

    return true
  })
