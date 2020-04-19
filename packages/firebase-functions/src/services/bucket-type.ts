import * as admin from 'firebase-admin'

const storage = admin.storage()

export type Bucket = ReturnType<typeof storage.bucket>
