import {
  AgeGroupsRepository,
  AgeGroups,
  AgeGroupsProps,
} from '@hoepel.app/isomorphic-domain'
import { collection, get, set } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  AgeGroupProps,
  SwitchOverOn,
} from '@hoepel.app/isomorphic-domain/src/age-groups/age-group'

export class FirestoreAgeGroupsRepository implements AgeGroupsRepository {
  private readonly collection = collection<{
    ageGroups: readonly AgeGroupProps[]
    switchOverOn: SwitchOverOn
  }>('age-groups')

  getForTenant(tenantId: string): Observable<AgeGroups> {
    return from(get(this.collection, tenantId)).pipe(
      map((result) => {
        if (result == null) {
          return AgeGroups.createEmpty(tenantId)
        }

        return AgeGroups.fromProps({ ...result.data, tenantId })
      })
    )
  }

  async put(entity: AgeGroups): Promise<void> {
    const { tenantId, ...toSave } = entity.toProps()
    await set(this.collection, entity.tenantId, toSave)
  }
}
