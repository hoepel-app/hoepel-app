import { RELEASE_ID } from '../../release'

export class Application {
  static release(): { release: string } {
    return { release: RELEASE_ID }
  }
}
