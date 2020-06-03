import { me } from './me'
import { application } from './application'
import { mutations } from './mutations'
import { parentPlatform } from './parent-platform'
import { gql, ApolloServer, IResolvers } from 'apollo-server-express'
import * as admin from 'firebase-admin'
import { UserService } from '../services/user.service'
import { parseToken } from './parse-token'
import { IUser, DayDate } from '@hoepel.app/types'
import * as Sentry from '@sentry/node'
import { tenant } from './tenant'
import { verifyJwt } from '../util/verify-jwt'
import { GraphQLScalarType } from 'graphql'

const db = admin.firestore()
const auth = admin.auth()

const userService = new UserService(db, auth)

const typeDef = gql`
  scalar DayDate
  scalar DateTime

  enum ReportType {
    ALL_CHILDREN
    ALL_CREW
    CHILDREN_WITH_COMMENT
    CREW_ATTENDANCES
    CHILD_ATTENDANCES
    FISCAL_CERTIFICATES_LIST
    CHILD_HEALTH_INSURANCE_CERTIFICATE
    CHILD_FISCAL_CERTIFICATE
    CHILD_INVOICE
    CHILDREN_PER_DAY
  }

  enum ReportFileFormat {
    XLSX
    PDF
    DOCX
  }

  type Report {
    id: ID!
    refPath: String!
    description: String!
    expires: String!
    created: String!
    format: ReportFileFormat!
    createdBy: String
    createdByUid: String!
    type: ReportType!
    childId: String
    year: Int
  }

  type Template {
    created: String!
    createdBy: String!
    fileName: String!
    displayName: String!
    type: ReportType!
  }

  type Query
  type Mutation
`

const resolvers: IResolvers = {
  ReportType: {
    ALL_CHILDREN: 'all-children',
    ALL_CREW: 'all-crew',
    CHILDREN_WITH_COMMENT: 'children-with-comment',
    CREW_ATTENDANCES: 'crew-attendances',
    CHILD_ATTENDANCES: 'child-attendances',
    FISCAL_CERTIFICATES_LIST: 'fiscal-certificates-list',
    CHILDREN_PER_DAY: 'children-per-day',
    CHILD_HEALTH_INSURANCE_CERTIFICATE: 'child-health-insurance-certificate',
    CHILD_FISCAL_CERTIFICATE: 'child-fiscal-certificate',
    CHILD_INVOICE: 'child-invoice',
  },
  DayDate: new GraphQLScalarType({
    name: 'DayDate',
    parseValue(value) {
      const parsed = DayDate.fromISO8601(value)

      if (isNaN(parsed.year) || isNaN(parsed.month) || isNaN(parsed.day)) {
        return null
      }

      return parsed
    },
    serialize(value: DayDate) {
      return value.toISO8601()
    },
    parseLiteral(ast) {
      if (ast.kind === 'StringValue') {
        const parsed = DayDate.fromISO8601(ast.value)
        if (isNaN(parsed.year) || isNaN(parsed.month) || isNaN(parsed.day)) {
          return null
        }
        return parsed
      }

      return null
    },
  }),
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    parseValue(value: string): Date | null {
      const parsed = new Date(value)

      if (isNaN(parsed.getTime())) {
        return null
      }

      return parsed
    },
    serialize(value: Date) {
      return value.toISOString()
    },
    parseLiteral(ast): Date | null {
      if (ast.kind === 'StringValue') {
        const parsed = new Date(ast.value)

        if (isNaN(parsed.getTime())) {
          return null
        }

        return parsed
      }

      return null
    },
  }),
}

export type Context = null | ParentPlatformUser | HoepelAppUser

export type ParentPlatformUser = {
  token: admin.auth.DecodedIdToken
  domain: 'parent-platform'
  user: {
    email: string
    uid: string
  }
}

export type HoepelAppUser = {
  token: admin.auth.DecodedIdToken
  domain: 'hoepel.app'
  user: IUser
}

/** Verify a token from a hoepel.app user */
const getHoepelAppUserAndTokenFromHeader = async (
  authorizationHeader: string
): Promise<HoepelAppUser | null> => {
  try {
    const decodedToken = await parseToken(authorizationHeader)
    const user = await userService.getUserFromDb(decodedToken.uid)

    if (user == null) {
      return null
    }

    return { token: decodedToken, user, domain: 'hoepel.app' }
  } catch (err) {
    return null
  }
}

/** Verify a token from a speelpleinwerking.com user */
const getSpeelpleinwerkingComUserAndTokenFromHeader = async (
  authorizationHeader: string
): Promise<ParentPlatformUser | null> => {
  try {
    const token = authorizationHeader.split(' ')
    const decodedToken = await verifyJwt(token[1])

    if (decodedToken == null || decodedToken.email == null) {
      return null
    }

    return {
      token: decodedToken,
      domain: 'parent-platform',
      user: {
        email: decodedToken.email,
        uid: decodedToken.user_id ?? decodedToken.uid,
      },
    }
  } catch (err) {
    return null
  }
}

const getUserAndTokenFromHeader = async (
  authorizationHeader: string | null
): Promise<Context> => {
  if (authorizationHeader == null) {
    return null
  }

  const hoepelUser = await getHoepelAppUserAndTokenFromHeader(
    authorizationHeader
  )

  if (hoepelUser != null) {
    return hoepelUser
  }

  const speelpleinwerkingComUser = await getSpeelpleinwerkingComUserAndTokenFromHeader(
    authorizationHeader
  )

  if (speelpleinwerkingComUser != null) {
    return speelpleinwerkingComUser
  }

  return null
}

export const server = new ApolloServer({
  plugins: [
    {
      requestDidStart: () => {
        return {
          didEncounterErrors: async (requestContext) => {
            const header =
              requestContext.request.http?.headers.get('Authorization') ?? null

            const userInfo = await getUserAndTokenFromHeader(header)

            Sentry.configureScope((scope) => {
              scope.setExtra('Authorization', header)

              if (userInfo != null) {
                if (userInfo.domain === 'hoepel.app') {
                  scope.setUser({
                    email: userInfo.user.email,
                    username: userInfo.user.displayName,
                    id: userInfo.token.uid,
                  })
                }

                if (userInfo.domain === 'parent-platform') {
                  scope.setUser({
                    email: userInfo.user.email,
                    id: userInfo.token.uid,
                  })
                }
              }

              requestContext.errors.forEach((err) => {
                console.error(err)
                Sentry.captureException(err)
              })
            })
          },
        }
      },
    },
  ],
  typeDefs: [
    typeDef,
    me.typeDef,
    mutations.typeDef,
    application.typeDef,
    tenant.typeDef,
    parentPlatform.typeDef,
  ],
  resolvers: [
    resolvers,
    me.resolvers,
    mutations.resolvers,
    application.resolvers,
    tenant.resolvers,
    parentPlatform.resolvers,
  ],
  introspection: true,
  playground: {
    endpoint: '/api/graphql',
  },
  tracing: true,
  context: async ({ req }): Promise<Context> =>
    getUserAndTokenFromHeader(req.headers.authorization ?? null),
})
