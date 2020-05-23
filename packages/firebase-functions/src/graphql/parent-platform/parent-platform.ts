import * as admin from 'firebase-admin'
import { Child, IChild } from '@hoepel.app/types'
import { createTenantRepository } from '../../services/tenant.service'

const db = admin.firestore()

const tenantRepo = createTenantRepository(db)

export class ParentPlatform {
  static async childrenManagedByMe(
    parentUid: string,
    organisationId: string
  ): Promise<readonly Child[]> {
    // TODO should be move to external service, e.g. ChildApplicationService
    const children: readonly Child[] = (
      await db
        .collection('children')
        .where('managedByParents', 'array-contains', parentUid)
        .where('tenant', '==', organisationId)
        .get()
    ).docs.map(
      (snapshot) =>
        new Child({ ...(snapshot.data() as IChild), id: snapshot.id })
    )

    return children
  }

  static async registerChildFromParentPlatform(
    organisationId: string,
    newChild: Child
  ): Promise<void> {
    // First check if organisation accepts external registrations
    const tenant = await tenantRepo.get(organisationId)

    if (tenant.enableOnlineRegistration !== true) {
      throw new Error(
        `Organisation '${organisationId}' does not accept online registrations`
      )
    }

    // Save child
    const newChildWithTenant = { ...newChild, tenant: organisationId }
    const serializedChild = JSON.parse(JSON.stringify(newChildWithTenant))
    await db.collection('children').add(serializedChild)
  }
}
