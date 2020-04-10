import * as jwt from 'jsonwebtoken'
import { get } from 'https'
import * as admin from 'firebase-admin'

interface GoogleKeyResponse {
  [indexer: string]: string
}

// Get current keys from Google
const getJwtKeys = (): Promise<ReadonlyArray<string>> =>
  new Promise((resolve, reject) => {
    get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const parsed: GoogleKeyResponse = JSON.parse(data)
            resolve(Object.keys(parsed).map((name) => parsed[name]))
          } catch (err) {
            console.error(
              'Error while parsing response of Google JWT keys',
              err
            )
            reject(err)
          }
        })
      }
    ).on('error', (err) => {
      console.error('Could not get JWT keys', err)
      reject(err)
    })
  })

const algorithm = 'RS256'
const iss = 'https://securetoken.google.com/speelpleinwerking-com'
const aud = 'speelpleinwerking-com'

/**
 * Verifies that a JWT token is valid for the speelpleinwerking.com project
 *
 * @return false in case JWT is invalid, decoded JWT if JWT is valid
 */
export const verifyJwt = async (
  token: string
): Promise<false | admin.auth.DecodedIdToken> => {
  const jwtKeys = await getJwtKeys()

  const list: (
    | { error: string; token: null }
    | { token: admin.auth.DecodedIdToken }
  )[] = jwtKeys.map((cert) => {
    try {
      const verifiedToken = jwt.verify(token, cert, {
        audience: aud,
        issuer: iss,
        algorithms: [algorithm],
      }) as admin.auth.DecodedIdToken | string

      if (typeof verifiedToken !== 'string' && verifiedToken.user_id != null) {
        return { token: verifiedToken }
      } else {
        return {
          error: 'Verified token was not string or user_id was not set',
          token: null,
        }
      }
    } catch (e) {
      return { error: e.message, token: null }
    }
  })

  const verifiedToken = list.find((el) => el.token != null)?.token || null

  if (verifiedToken == null) {
    console.error(
      `Invalid token! Token:\n ${token}\n\nKeys used:\n${jwtKeys.join(
        '\n'
      )}\n\nErrors: `,
      JSON.stringify(list)
    )
    return false // Instead of returning false, this could reject the promise?
  }

  return verifiedToken
}
