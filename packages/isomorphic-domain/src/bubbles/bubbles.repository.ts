import { Observable } from 'rxjs'
import { Bubbles } from './bubbles'

export type BubblesRepository = {
  getForTenant(tenantId: string): Observable<Bubbles>
  put(entity: Bubbles): Promise<void>
}
