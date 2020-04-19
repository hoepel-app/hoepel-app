import { AgeGroups } from './age-groups'

export type AgeGroupsRepository = {
  findForTenant(tenantId: string): Promise<AgeGroups>
  putForTenant(tenantId: string, entity: AgeGroups): Promise<void>
}
