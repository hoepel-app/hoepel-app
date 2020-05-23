import { Observable } from 'rxjs'
import { ChildOnRegistrationWaitingList } from './child-on-registration-waiting-list'

export type ChildRegistrationWaitingListRepository = {
  getAll(
    tenantId: string
  ): Observable<readonly ChildOnRegistrationWaitingList[]>

  getById(
    tenantId: string,
    id: string
  ): Observable<ChildOnRegistrationWaitingList | null>

  add(entity: ChildOnRegistrationWaitingList): Promise<void>

  delete(tenantId: string, id: string): Promise<void>
}
