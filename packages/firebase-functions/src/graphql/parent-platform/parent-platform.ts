import * as admin from 'firebase-admin'
// import { createChildRepository } from '../../services/child.service'
import { Child, IChild } from '@hoepel.app/types'

const db = admin.firestore()

// const childRepo = createChildRepository(db)

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
}
