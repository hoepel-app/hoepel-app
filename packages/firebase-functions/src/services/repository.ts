import * as admin from 'firebase-admin'
import {
  DocumentNotFoundError,
  IncorrectTenantError,
  MappingCollection,
  Repository,
  TenantIndexedMappingCollection,
  TenantIndexedRepository,
} from '@hoepel.app/types'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'

export class FirebaseTenantIndexedRepository<IT extends Omit<IT, 'tenant'>, T>
  implements TenantIndexedRepository<T> {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private collection: TenantIndexedMappingCollection<IT, T>
  ) {}

  async get(tenant: string, id: string): Promise<T> {
    const snapshot: DocumentSnapshot = await this.db
      .collection(this.collection.collectionName)
      .doc(id)
      .get()

    if (!snapshot.exists) {
      throw new DocumentNotFoundError(id, this.collection.collectionName)
    }

    const dataWithTenant = snapshot.data() as IT & { tenant: string }
    const { tenant: actualTenant, ...data } = dataWithTenant

    if (actualTenant !== tenant) {
      throw new IncorrectTenantError(
        tenant,
        actualTenant,
        this.collection.collectionName,
        id
      )
    } else {
      return this.collection.mapper.lift(id, data)
    }
  }

  async getAll(tenant: string): Promise<ReadonlyArray<T>> {
    const snapshot = await this.db
      .collection(this.collection.collectionName)
      .where('tenant', '==', tenant)
      .get()

    return snapshot.docs
      .filter(docSnapshot => docSnapshot.data().tenant === tenant)
      .map(docSnapshot => {
        const { tenant: actualTenant, ...obj } = docSnapshot.data()
        return this.collection.mapper.lift(
          docSnapshot.id,
          obj as Pick<IT & { tenant: string }, Exclude<keyof IT, 'tenant'>>
        )
      })
  }

  async getMany(
    tenant: string,
    ids: ReadonlyArray<string>
  ): Promise<ReadonlyArray<T>> {
    if (ids.length > 0) {
      const docReferences = ids.map((id: string) =>
        this.db.collection(this.collection.collectionName).doc(id)
      )
      const snapshots = await this.db.getAll(...docReferences)

      return snapshots
        .filter(snapshot => snapshot.exists)
        .map(snapshot => {
          // We know snapshot.data() is defined because of filtering on exists
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { tenant: actualTenant, ...obj } = snapshot.data()!
          return this.collection.mapper.lift(
            snapshot.id,
            obj as Pick<IT & { tenant: string }, Exclude<keyof IT, 'tenant'>>
          )
        })
    } else {
      return Promise.resolve([])
    }
  }

  async delete(tenant: string, id: string): Promise<void> {
    await this.get(tenant, id) // will throw if incorrect tenant
    await this.db
      .collection(this.collection.collectionName)
      .doc(id)
      .delete()
  }
}

export class FirebaseRepository<IT, T> implements Repository<T> {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private collection: MappingCollection<IT, T>
  ) {}

  async get(id: string): Promise<T> {
    const snapshot: DocumentSnapshot = await this.db
      .collection(this.collection.collectionName)
      .doc(id)
      .get()

    if (!snapshot.exists) {
      throw new DocumentNotFoundError(id, this.collection.collectionName)
    } else {
      return this.collection.mapper.lift(id, snapshot.data() as IT)
    }
  }

  async getAll(): Promise<ReadonlyArray<T>> {
    const snapshot = await this.db
      .collection(this.collection.collectionName)
      .get()

    return snapshot.docs.map(docSnapshot => {
      const obj = docSnapshot.data()
      return this.collection.mapper.lift(docSnapshot.id, obj as IT)
    })
  }

  async getMany(ids: ReadonlyArray<string>): Promise<ReadonlyArray<T>> {
    if (ids.length > 0) {
      const docReferences = ids.map((id: string) =>
        this.db.collection(this.collection.collectionName).doc(id)
      )
      const snapshots = await this.db.getAll(...docReferences)

      return snapshots
        .filter(snapshot => snapshot.exists)
        .map(snapshot => {
          return this.collection.mapper.lift(snapshot.id, snapshot.data() as IT)
        })
    } else {
      return Promise.resolve([])
    }
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection(this.collection.collectionName)
      .doc(id)
      .delete()
  }
}
