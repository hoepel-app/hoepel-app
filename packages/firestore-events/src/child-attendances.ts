import * as functions from 'firebase-functions'
import {
  ChildAttendanceAddDoc,
  IDetailedChildAttendance,
} from '@hoepel.app/types'
import admin from 'firebase-admin'

const db = admin.firestore()

export const onChildAttendanceCreate = functions
  .region('europe-west1')
  .firestore.document('child-attendances-add/{docId}')
  .onCreate(async (snap, context) => {
    const value = snap.data() as ChildAttendanceAddDoc & { tenant: string }

    const childId = value.childId
    const shiftId = value.shiftId
    const tenant = value.tenant
    const details = value.doc

    await db
      .collection('child-attendances-by-shift')
      .doc(shiftId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data()
          if (data != null && data.tenant === tenant) {
            const update: { [key: string]: IDetailedChildAttendance } = {}
            update['attendances.' + childId] = details
            db.collection('child-attendances-by-shift')
              .doc(shiftId)
              .update(update)
          } else {
            console.error(
              'Tried to update a child attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', update doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          const byShift: { [key: string]: IDetailedChildAttendance } = {}
          byShift[childId] = details

          db.collection('child-attendances-by-shift')
            .doc(shiftId)
            .set({ tenant, attendances: byShift })
        }
      })

    await db
      .collection('child-attendances-by-child')
      .doc(childId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data()
          if (data != null && data.tenant === tenant) {
            const update: { [key: string]: IDetailedChildAttendance } = {}
            update['attendances.' + shiftId] = details
            db.collection('child-attendances-by-child')
              .doc(childId)
              .update(update)
          } else {
            console.error(
              'Tried to update a child attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', update doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          const byChild: { [key: string]: IDetailedChildAttendance } = {}
          byChild[shiftId] = details

          db.collection('child-attendances-by-child')
            .doc(childId)
            .set({ tenant, attendances: byChild })
        }
      })

    await db
      .collection('child-attendances-add')
      .doc(context.params.docId)
      .delete()

    return true
  })

export const onChildAttendanceDelete = functions
  .region('europe-west1')
  .firestore.document('child-attendances-delete/{docId}')
  .onCreate(async (snap, context) => {
    const value = snap.data()

    if (value == null) {
      throw new Error(`Undefined body for child-attendances-delete/${snap.id}`)
    }

    const childId = value.childId
    const shiftId = value.shiftId
    const tenant = value.tenant

    await db
      .collection('child-attendances-by-shift')
      .doc(shiftId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data()
          if (data != null && data.tenant === tenant) {
            const update = { ...data }
            delete update.attendances[childId]
            db.collection('child-attendances-by-shift').doc(shiftId).set(update)
          } else {
            console.error(
              'Tried to update a child attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', delete doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          console.error(
            'Tried to delete a non-existant child attendance. Delete document: ' +
              JSON.stringify(value)
          )
        }
      })

    await db
      .collection('child-attendances-by-child')
      .doc(childId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data()
          if (data != null && data.tenant === tenant) {
            const update = { ...data }
            delete update.attendances[shiftId]
            db.collection('child-attendances-by-child').doc(childId).set(update)
          } else {
            console.error(
              'Tried to set a child attendance document belonging to a different tenant! Existing doc: ' +
                JSON.stringify(doc.data()) +
                ', delete doc: ' +
                JSON.stringify(value)
            )
          }
        } else {
          console.error(
            'Tried to delete a non-existant child attendance. Delete document: ' +
              JSON.stringify(value)
          )
        }
      })

    await db
      .collection('child-attendances-delete')
      .doc(context.params.docId)
      .delete()

    return true
  })
