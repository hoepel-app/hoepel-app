import admin from 'firebase-admin'
import { IUser } from '@hoepel.app/types'

export class Me {
  static me(token: admin.auth.DecodedIdToken, user: IUser): any {
    return {
      id: token?.uid,
      displayName: user?.displayName,
      acceptedPrivacyPolicy: user?.acceptedPrivacyPolicy?.getTime().toString(),
      acceptedTermsAndConditions: user?.acceptedTermsAndConditions
        ?.getTime()
        .toString(),
      email: user?.email,
    }
  }

  static token(token: admin.auth.DecodedIdToken): any {
    return {
      picture: token.picture,
      isAdmin: token.isAdmin || false,
      tenants: Object.keys(token.tenants || {}),
      email: token.email,
      emailVerified: token.email_verified,
      iss: token.iss,
      aud: token.aud,
      authTime: token.auth_time,
      sub: token.sub,
      uid: token.uid,
      iat: token.iat,
      exp: token.exp,
    }
  }
}
