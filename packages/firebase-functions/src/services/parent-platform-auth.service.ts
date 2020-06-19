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
  async getDetailsForParent(uid: string): Promise<ParentDetails> {
    try {
      const record = await pTimeout(parentPlatformApp.auth().getUser(uid), 1000)

      if (record == null || record.email == null) {
        return null
      }

      return {
        displayName: record.displayName ?? null,
        email: record.email ?? null,
      }
    } catch (err) {
      console.error(
        'Error while getting parent details from parent platform project',
        err
      )
      return null
    }
  }
}
