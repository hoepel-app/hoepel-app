import {
  AgeGroupsRepository,
  AgeGroups,
  AgeGroupsProps,
} from '@hoepel.app/isomorphic-domain'
import { collection, get, set } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'

export class FirestoreAgeGroupsRepository implements AgeGroupsRepository {
  private readonly collection = collection<AgeGroupsProps>('age-groups')

  getForTenant(tenantId: string): Observable<AgeGroups> {
    return from(get(this.collection, tenantId)).pipe(
      map((result) => {
        if (result == null) {
          return AgeGroups.createEmpty(tenantId)
        }

        return AgeGroups.fromProps(result.data)
      })
    )
  }

  async put(entity: AgeGroups): Promise<void> {
    await set(this.collection, entity.tenantId, entity.toProps())
  }
}
