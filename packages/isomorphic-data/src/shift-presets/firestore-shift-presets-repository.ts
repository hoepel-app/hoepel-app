import { collection, get, set } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  ShiftPresetsRepository,
  ShiftPresets,
  ShiftPresetProps,
} from '@hoepel.app/isomorphic-domain'

export class FirestoreShiftPresetsRepository implements ShiftPresetsRepository {
  private readonly collection = collection<{
    readonly presets: readonly ShiftPresetProps[]
  }>('shift-presets')

  getForTenant(tenantId: string): Observable<ShiftPresets> {
    return from(get(this.collection, tenantId)).pipe(
      map((result) => {
        if (result == null) {
          return ShiftPresets.createEmpty(tenantId)
        }

        return ShiftPresets.fromProps({
          shiftPresets: result.data.presets,
          tenantId,
        })
      })
    )
  }

  async put(entity: ShiftPresets): Promise<void> {
    const { tenantId, ...data } = entity.toProps()
    await set(this.collection, entity.tenantId, {
      presets: data.shiftPresets,
    })
  }
}
