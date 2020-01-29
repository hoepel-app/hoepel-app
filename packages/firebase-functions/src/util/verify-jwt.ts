import * as jwt from 'jsonwebtoken'
import { get } from 'https'

interface GoogleKeyResponse {
  [indexer: string]: string
}

// Get current keys from Google
const getJwtKeys = (): Promise<ReadonlyArray<string>> =>
  new Promise((resolve, reject) => {
    get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      res => {
        let data = ''

        res.on('data', chunk => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const parsed: GoogleKeyResponse = JSON.parse(data)
            resolve(Object.keys(parsed).map(name => parsed[name]))
          } catch (err) {
            console.error(
              'Error while parsing response of Google JWT keys',
              err
            )
            reject(err)
          }
        })
      }
    ).on('error', err => {
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
): Promise<false | { user_id: string; [key: string]: any }> => {
  const jwtKeys = await getJwtKeys()

  let result: { user_id: string; [key: string]: any }
  const errors: Error[] = []

  const isValid =
    jwtKeys
      .map(cert => {
        try {
          const verifiedToken: any = jwt.verify(token, cert, {
            audience: aud,
            issuer: iss,
            algorithms: [algorithm],
          })

          if (verifiedToken.user_id != null) {
            result = verifiedToken
            return true
          } else {
            return false
          }
        } catch (e) {
          errors.push(e)
          return false
        }
      })
      .indexOf(true) !== -1

  if (!isValid) {
    console.error(
      `Invalid token! Token:\n ${token}\n\nKeys used:\n${jwtKeys.join(
        '\n'
      )}\n\nErrors: `,
      errors
    )
    return false // Instead of returning false, this could reject the promise?
  }

  return result
}
