import * as admin from 'firebase-admin'

export const parseToken = async (
  authorizationHeader: string
): Promise<admin.auth.DecodedIdToken> => {
  const token = authorizationHeader?.split(' ')?.[1]

  if (!token) {
    throw new Error('Token not found in Authorization header')
  }

  return await admin.auth().verifyIdToken(token)
}

export default parseToken
