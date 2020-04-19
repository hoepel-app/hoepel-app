import {
  AgeGroupsRepository,
  AgeGroups,
  AgeGroupsProps,
} from '@hoepel.app/isomorphic-domain'
import { collection, get, set } from 'typesaurus'

export class FirestoreAgeGroupsRepository implements AgeGroupsRepository {
  private collection = collection<AgeGroupsProps>('age-groups')

  async findForTenant(tenantId: string): Promise<AgeGroups> {
    const result = await get(this.collection, tenantId)

    if (result == null) {
      return AgeGroups.createEmpty()
    }

    return AgeGroups.fromProps(result.data)
  }

  async putForTenant(tenantId: string, entity: AgeGroups): Promise<void> {
    await set(this.collection, tenantId, entity.toProps())
  }
}
