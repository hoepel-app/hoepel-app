import { AgeGroups } from './age-groups'
import { Observable } from 'rxjs'

export type AgeGroupsRepository = {
  findForTenant(tenantId: string): Observable<AgeGroups>
  putForTenant(tenantId: string, entity: AgeGroups): Promise<void>
}
