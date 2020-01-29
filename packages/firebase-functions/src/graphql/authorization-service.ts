import { Context } from '.'

export class AuthorizationService {
  constructor(private context: Context) {}

  assertLoggedIn(): void {
    if (!this.context.user) {
      throw new Error('Not logged in')
    }
  }
}
