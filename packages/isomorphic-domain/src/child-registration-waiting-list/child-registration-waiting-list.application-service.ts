import { ChildRegistrationWaitingListRepository } from './child-registration-waiting-list.repository'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ChildOnRegistrationWaitingList } from './child-on-registration-waiting-list'

export class ChildRegistrationWaitingListApplicationService {
  constructor(private readonly repo: ChildRegistrationWaitingListRepository) {}

  numChildrenOnWaitingList(tenantId: string): Observable<number> {
    return this.repo.getAll(tenantId).pipe(map((list) => list.length))
  }

  childrenOnWaitingList(
    tenantId: string
  ): Observable<readonly ChildOnRegistrationWaitingList[]> {
    return this.repo.getAll(tenantId)
  }

  removeChildFromRegistrationWaitingList(
    tenantId: string,
    childOnWaitingListId: string
  ): Promise<void> {
    return this.repo.delete(tenantId, childOnWaitingListId)
  }
}
