import admin from 'firebase-admin'
import { ITenant, IUser } from '@hoepel.app/types'
import { createTenantRepository } from '../../services/tenant.service'

const tenantRepo = createTenantRepository(admin.firestore())

export class Tenant {
  static async tenants(
    user: IUser | null
  ): Promise<readonly Partial<ITenant>[]> {
    const tenants = await tenantRepo.getAll()

    if (user == null) {
      return tenants.map(stripNonPublicFields)
    }

    return tenants
  }

  static async tenant(
    user: IUser | null,
    id: string
  ): Promise<Partial<ITenant>> {
    const tenant = await tenantRepo.get(id)

    if (user == null) {
      return stripNonPublicFields(tenant)
    }

    return tenant
  }
}

const stripNonPublicFields = (tenant: ITenant): Partial<ITenant> => {
  return {
    id: tenant.id,
    description: tenant.description,
    logoSmallUrl: tenant.logoSmallUrl,
    logoUrl: tenant.logoUrl,
    name: tenant.name,
    privacyPolicyUrl: tenant.privacyPolicyUrl,
  }
}
