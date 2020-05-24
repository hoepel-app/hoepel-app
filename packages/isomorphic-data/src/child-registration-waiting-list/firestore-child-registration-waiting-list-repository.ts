import {
  ChildRegistrationWaitingListRepository,
  ChildOnRegistrationWaitingListProps,
  ChildOnRegistrationWaitingList,
} from '@hoepel.app/isomorphic-domain'
import { collection, upset, get, remove, query, where } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map, first } from 'rxjs/operators'

export class FirestoreChildRegistrationWaitingListRepository
  implements ChildRegistrationWaitingListRepository {
  private readonly collection = collection<
    Omit<ChildOnRegistrationWaitingListProps, 'id'>
  >('child-registration-waiting-list')

  async add(entity: ChildOnRegistrationWaitingList): Promise<void> {
    const { id, ...newChild } = entity.toProps()
    await upset(this.collection, id, newChild)
  }

  getById(
    tenantId: string,
    id: string
  ): Observable<ChildOnRegistrationWaitingList | null> {
    return from(get(this.collection, id)).pipe(
      map((maybeChild) => {
        if (maybeChild == null || maybeChild.data.tenant != tenantId) {
          return null
        }

        return ChildOnRegistrationWaitingList.fromProps({
          ...maybeChild.data,
          id,
        })
      })
    )
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id).pipe(first()).toPromise()

    if (existing == null) {
      throw new Error(
        `Could not delete, child on registration waiting list not found with id ${id} for tenant ${tenantId}`
      )
    }

    await remove(this.collection, id)
  }

  getAll(
    tenantId: string
  ): Observable<readonly ChildOnRegistrationWaitingList[]> {
    return from(query(this.collection, [where('tenant', '==', tenantId)])).pipe(
      map((docs) =>
        docs
          .map((doc) => {
            return ChildOnRegistrationWaitingList.fromProps({
              ...doc.data,
              id: doc.ref.id,
            })
          })
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
      )
    )
  }
}
