import * as admin from 'firebase-admin'
import { IUser } from '@hoepel.app/types'

export class UserService {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly auth: admin.auth.Auth
  ) {}

  async acceptPrivacyPolicy(uid: string): Promise<void> {
    await this.db
      .collection('users')
      .doc(uid)
      .set({ acceptedPrivacyPolicy: new Date() }, { merge: true })
  }

  async acceptTermsAndConditions(uid: string): Promise<void> {
    await this.db
      .collection('users')
      .doc(uid)
      .set({ acceptedTermsAndConditions: new Date() }, { merge: true })
  }

  getUsers(
    maxResults?: number,
    pageToken?: string
  ): Promise<admin.auth.ListUsersResult> {
    return this.auth.listUsers(maxResults, pageToken)
  }

  getUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.auth.getUser(uid)
  }

  async getUserFromDb(uid: string): Promise<IUser | null> {
    return this.db
      .collection('users')
      .doc(uid)
      .get()
      .then((snap) => {
        if (snap.exists) {
          const data = snap.data()
          const acceptedPrivacyPolicy: Date | null = data?.acceptedPrivacyPolicy?.toDate()
          const acceptedTermsAndConditions: Date | null = data?.acceptedTermsAndConditions?.toDate()

          return {
            ...data,
            acceptedPrivacyPolicy,
            acceptedTermsAndConditions,
          } as IUser
        } else {
          return null
        }
      })
  }

  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    // Update in Firestore
    await this.db
      .collection('users')
      .doc(uid)
      .set({ displayName: displayName }, { merge: true })

    // Update user property
    await this.auth.updateUser(uid, {
      displayName: displayName,
    })
  }
}
