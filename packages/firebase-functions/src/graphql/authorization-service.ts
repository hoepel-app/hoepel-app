import { Context } from '.'

export class AuthorizationService {
  static assertLoggedIn(
    context: Context
  ): asserts context is NonNullable<Required<Context>> {
    if (context.user == null || context.token == null) {
      throw new Error('Not logged in')
    }
  }
}
