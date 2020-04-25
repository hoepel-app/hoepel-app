import { AgeGroups } from './age-groups'
import { Observable } from 'rxjs'

export type AgeGroupsRepository = {
  getForTenant(tenantId: string): Observable<AgeGroups>
  put(entity: AgeGroups): Promise<void>
}
