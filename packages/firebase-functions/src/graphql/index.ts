import { me } from './me'
import { application } from './application'
import { mutations } from './mutations'
import { gql, ApolloServer } from 'apollo-server-express'
import * as admin from 'firebase-admin'
import { UserService } from '../services/user.service'
import { parseToken } from './parse-token'
import { IUser } from '@hoepel.app/types'
import * as Sentry from '@sentry/node'
import { tenant } from './tenant'

const db = admin.firestore()
const auth = admin.auth()

const userService = new UserService(db, auth)

const typeDef = gql`
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

const resolvers = {
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
}

export type Context = {
  token?: admin.auth.DecodedIdToken
  user?: IUser
}

const getUserAndTokenFromHeader = async (
  authorizationHeader: string | null
): Promise<{ user: IUser; token: admin.auth.DecodedIdToken } | null> => {
  if (authorizationHeader == null) {
    return null
  }

  try {
    const decodedToken = await parseToken(authorizationHeader)
    const user = await userService.getUserFromDb(decodedToken.uid)

    if (user == null) {
      return null
    }

    return { token: decodedToken, user }
  } catch (err) {
    return null
  }
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
              if (userInfo != null) {
                scope.setUser({
                  email: userInfo.user.email,
                  username: userInfo.user.displayName,
                  id: userInfo.token.uid,
                })
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
  ],
  resolvers: [
    resolvers,
    me.resolvers,
    mutations.resolvers,
    application.resolvers,
    tenant.resolvers,
  ],
  introspection: true,
  playground: {
    endpoint: '/api/graphql',
  },
  tracing: true,
  context: async ({ req }): Promise<Context> => {
    return (
      (await getUserAndTokenFromHeader(req.headers.authorization ?? null)) || {}
    )
  },
})
