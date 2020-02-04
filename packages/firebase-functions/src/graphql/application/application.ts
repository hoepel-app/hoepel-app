import { RELEASE_ID } from '../../release'
import { ENVIRONMENT } from '../../environment'

export class Application {
  static release(): string {
    return RELEASE_ID
  }

  static environment(): string {
    return ENVIRONMENT
  }
}
