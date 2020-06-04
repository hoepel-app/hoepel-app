import {
  BubblesRepository,
  Bubbles,
  BubbleProps,
} from '@hoepel.app/isomorphic-domain'
import { Observable, from } from 'rxjs'
import { get, collection, set } from 'typesaurus'
import { map } from 'rxjs/operators'

export class FirestoreBubblesRepository implements BubblesRepository {
  private readonly collection = collection<{
    readonly bubbles: readonly BubbleProps[]
  }>('bubbles')

  getForTenant(tenantId: string): Observable<Bubbles> {
    return from(get(this.collection, tenantId)).pipe(
      map((result) => {
        if (result == null) {
          return Bubbles.createEmpty(tenantId)
        }

        return Bubbles.fromProps({
          bubbles: result.data.bubbles,
          tenantId,
        })
      })
    )
  }

  async put(entity: Bubbles): Promise<void> {
    const { tenantId, ...data } = entity.toProps()
    await set(this.collection, entity.tenantId, {
      bubbles: data.bubbles,
    })
  }
}
