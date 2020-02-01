import admin from 'firebase-admin'
import { IUser } from '@hoepel.app/types'

type GraphQLMe = {
  id: string
  displayName?: string
  acceptedPrivacyPolicy?: string
  acceptedTermsAndConditions?: string
  email: string
}

type GraphQLToken = {
  picture: string
  isAdmin: boolean
  tenants: readonly string[]
  email: string
  emailVerified: boolean
  iss: string
  aud: string
  authTime: number
  sub: string
  uid: string
  iat: number
  exp: number
}

export class Me {
  static me(token: admin.auth.DecodedIdToken, user: IUser): GraphQLMe {
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

  static token(token: admin.auth.DecodedIdToken): GraphQLToken {
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
