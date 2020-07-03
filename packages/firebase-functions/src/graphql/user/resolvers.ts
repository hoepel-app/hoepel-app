import { IResolvers } from 'apollo-server-express'
import { Context } from '../index'
import { AuthorizationService } from '../authorization-service'
import * as admin from 'firebase-admin'
import { UserService } from '../../services/user.service'

const db = admin.firestore()
const auth = admin.auth()
const userService = new UserService(db, auth)

type User = {
  uid: string
  email?: string
  emailVerified: boolean
  displayName?: string
  photoURL?: string
  disabled: boolean
  lastSignInTime: string
  creationTime: string
  customClaims: { [key: string]: unknown } | null
}

type UserList = {
  pageToken: string | null
  list: readonly User[]
}

const userRecordToUser = (record: admin.auth.UserRecord): User => {
  return {
    uid: record.uid,
    email: record.email,
    emailVerified: record.emailVerified,
    creationTime: record.metadata.creationTime,
    lastSignInTime: record.metadata.lastSignInTime,
    disabled: record.disabled,
    displayName: record.displayName,
    photoURL: record.photoURL,
    customClaims: record.customClaims || null,
  }
}

export const resolvers: IResolvers = {
  Query: {
    users: async (
      _,
      { pageToken }: { pageToken: string | null },
      context: Context
    ): Promise<UserList> => {
      AuthorizationService.assertLoggedInAdmin(context)
      const result = await userService.getUsers(1000, pageToken || undefined)

      return {
        pageToken: result.pageToken || null,
        list: result.users.map(userRecordToUser),
      }
    },
    user: async (_, { id }, context: Context): Promise<User | null> => {
      AuthorizationService.assertLoggedInAdmin(context)
      const user = await userService.getUser(id)

      if (user == null) {
        return null
      }

      return userRecordToUser(user)
    },
  },
  User: {
    id: ({ uid }: User) => uid,
  },
}
