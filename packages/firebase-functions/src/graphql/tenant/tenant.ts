import admin from 'firebase-admin'
import { ITenant } from '@hoepel.app/types'
import { createTenantRepository } from '../../services/tenant.service'
import { HoepelAppUser } from '..'

const tenantRepo = createTenantRepository(admin.firestore())

export class Tenant {
  static async tenants(
    user: HoepelAppUser | null
  ): Promise<readonly Partial<ITenant>[]> {
    const tenants = await tenantRepo.getAll()

    if (user == null) {
      return tenants.map(stripNonPublicFields)
    }

    return tenants
  }

  static async tenant(
    user: HoepelAppUser | null,
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
    enableOnlineEnrollment: tenant.enableOnlineEnrollment,
    enableOnlineRegistration: tenant.enableOnlineRegistration,
  }
}
