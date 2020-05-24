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

  // TODO should be a command
  removeChildFromRegistrationWaitingList(
    tenantId: string,
    childOnWaitingListId: string
  ): Promise<void> {
    return this.repo.delete(tenantId, childOnWaitingListId)
  }

  // TODO should be a command
  addChildToWaitingList(child: ChildOnRegistrationWaitingList): Promise<void> {
    return this.repo.add(child)
  }

  childrenOnRegistrationWaitingListForParent(
    tenantId: string,
    parentUid: string
  ): Observable<readonly ChildOnRegistrationWaitingList[]> {
    return this.repo
      .getAll(tenantId)
      .pipe(
        map((list) =>
          list.filter((child) => child.createdByParentUid === parentUid)
        )
      )
  }
}
