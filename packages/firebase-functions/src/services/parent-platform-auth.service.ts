import admin from 'firebase-admin'
import * as functions from 'firebase-functions'
// eslint-disable-next-line import/default
import pTimeout from 'p-timeout'

const parentPlatformServiceAccount = functions.config().parentplatform.key

const parentPlatformAppConfig: admin.AppOptions = {
  credential: admin.credential.cert(parentPlatformServiceAccount),
}

const parentPlatformApp = admin.initializeApp(
  parentPlatformAppConfig,
  'parentPlatformApp'
)

export type ParentDetails = null | {
  displayName: string | null
  email: string
}

export type ParentPlatformAuthService = {
  getDetailsForParent: (uid: string) => Promise<ParentDetails>
}

export class ParentPlatformAuthServiceImpl {
  private readonly cache = new Map<string, ParentDetails>()

  async getDetailsForParent(uid: string): Promise<ParentDetails> {
    if (this.cache.has(uid)) {
      return this.cache.get(uid) || null
    }

    try {
      const record = await pTimeout(parentPlatformApp.auth().getUser(uid), 3000)

      if (record == null || record.email == null) {
        this.cache.set(uid, null)
        return null
      }

      const details = {
        displayName: record.displayName ?? null,
        email: record.email ?? null,
      }
      this.cache.set(uid, details)

      return details
    } catch (err) {
      console.error(
        'Error while getting parent details from parent platform project',
        err
      )
      return null
    }
  }
}
