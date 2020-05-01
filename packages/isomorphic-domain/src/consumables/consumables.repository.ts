import { Observable } from 'rxjs'
import { Consumables } from './consumables'

export type ConsumablesRepository = {
  getForTenant(tenantId: string): Observable<Consumables>
  put(entity: Consumables): Promise<void>
}
