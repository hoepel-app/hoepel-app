import { Observable } from 'rxjs'
import { Discounts } from './discounts'

export type DiscountsRepository = {
  getForTenant(tenantId: string): Observable<Discounts>
  put(entity: Discounts): Promise<void>
}
