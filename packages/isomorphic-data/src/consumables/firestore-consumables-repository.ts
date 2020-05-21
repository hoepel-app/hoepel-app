import { collection, get, set } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  ConsumablesRepository,
  Consumables,
  ConsumableProps,
} from '@hoepel.app/isomorphic-domain'

export class FirestoreConsumablesRepository implements ConsumablesRepository {
  private readonly collection = collection<{
    readonly consumables: readonly ConsumableProps[]
  }>('consumables')

  getForTenant(tenantId: string): Observable<Consumables> {
    return from(get(this.collection, tenantId)).pipe(
      map((result) => {
        if (result == null) {
          return Consumables.createEmpty(tenantId)
        }

        return Consumables.fromProps({
          consumables: result.data.consumables,
          tenantId,
        })
      })
    )
  }

  async put(entity: Consumables): Promise<void> {
    const { tenantId, ...data } = entity.toProps()
    await set(this.collection, entity.tenantId, {
      consumables: data.consumables,
    })
  }
}
