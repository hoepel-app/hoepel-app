import * as admin from 'firebase-admin'
import { IUser, Permission } from '@hoepel.app/types'

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

  async assertUserManagesOrganisation(
    uid: string,
    organisationId: string
  ): Promise<void> {
    const doc = await this.db
      .collection('users')
      .doc(uid)
      .collection('tenants')
      .doc(organisationId)
      .get()

    if (!doc.exists) {
      throw new Error(`User ${uid} is not a member of ${organisationId}`)
    }

    const permissions = doc.data()?.permissions

    if (
      !Array.isArray(permissions) ||
      !permissions.includes(Permission.TenantWrite)
    ) {
      throw new Error(
        `User ${uid} does not manage ${organisationId}: does not have ${Permission.TenantWrite} permission`
      )
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      return await this.auth.getUser(uid)
    } catch (err) {
      return null
    }
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
