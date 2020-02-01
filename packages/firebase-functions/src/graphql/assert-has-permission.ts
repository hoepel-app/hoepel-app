import { NoPermissionError } from '../errors/no-permission.error'
import { Permission } from '@hoepel.app/types'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const assertHasPermission = async (
  uid: string,
  tenant: string,
  permission: Permission
): Promise<void> => {
  console.log(`Checking if ${uid} has permission ${permission}`)

  if (!uid) {
    throw new NoPermissionError('Uid not set')
  }

  try {
    const permissionsDoc = await db
      .collection('users')
      .doc(uid)
      .collection('tenants')
      .doc(tenant)
      .get()

    if (
      !permissionsDoc.exists ||
      !permissionsDoc?.data()?.permissions?.includes(permission)
    ) {
      throw new NoPermissionError(
        `No permission to access this resource (need ${permission} for tenant ${tenant})`,
        {
          permissionsDocExists: permissionsDoc.exists,
          permissionNeeded: permission,
          permissions: permissionsDoc.data()?.permissions,
          tenant,
        }
      )
    }
  } catch (err) {
    if (err instanceof NoPermissionError) {
      throw err // re-throw local error
    } else {
      throw new NoPermissionError(
        'Unexpected error checking permission',
        { tenant },
        err
      )
    }
  }
}
