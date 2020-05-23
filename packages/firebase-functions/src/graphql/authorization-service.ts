import { Context, HoepelAppUser, ParentPlatformUser } from './index'

export class AuthorizationService {
  static assertLoggedInHoepelApp(
    context: Context
  ): asserts context is NonNullable<HoepelAppUser> {
    if (context == null || context.user == null || context.token == null) {
      throw new Error('Not logged in')
    }

    if (context.domain !== 'hoepel.app') {
      throw new Error('Logged in, but not a hoepel.app token')
    }
  }

  static assertLoggedInParentPlatform(
    context: Context
  ): asserts context is NonNullable<ParentPlatformUser> {
    if (context == null || context.user == null || context.token == null) {
      throw new Error('Not logged in')
    }

    if (context.domain !== 'parent-platform') {
      throw new Error('Logged in, but not a token for the parent platform')
    }
  }
}
