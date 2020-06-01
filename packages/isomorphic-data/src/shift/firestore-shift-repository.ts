import {
  ShiftRepository,
  SerializedShift,
  Shift,
  serializeShift,
  deserializeShift,
} from '@hoepel.app/isomorphic-domain'
import {
  collection,
  set,
  remove,
  update,
  get,
  query,
  where,
  getMany,
} from 'typesaurus'
import { Observable, from } from 'rxjs'
import { first, map } from 'rxjs/operators'
import { DayDate } from '@hoepel.app/types'

export class FirestoreShiftRepository implements ShiftRepository {
  private readonly collection = collection<SerializedShift>('shifts')

  async create(shift: Shift): Promise<void> {
    const { id, shift: serialized } = serializeShift(shift)
    await set(this.collection, id, serialized)
  }

  async delete(tenantId: string, shiftId: string): Promise<void> {
    const toDelete = await this.getById(tenantId, shiftId)
      .pipe(first())
      .toPromise()

    if (toDelete == null) {
      return
    }

    if (toDelete.tenantId !== tenantId) {
      throw new Error(
        `Cannot delete shift ${shiftId}: belongs to ${toDelete.tenantId}, which is !== ${tenantId}`
      )
    }

    await remove(this.collection, shiftId)
  }

  async update(shift: Shift): Promise<void> {
    const toUpdate = await this.getById(shift.tenantId, shift.id)
      .pipe(first())
      .toPromise()

    if (toUpdate === null) {
      throw new Error(`Asked to update shift ${shift.id}, but does not exist`)
    }

    if (toUpdate.tenantId !== shift.tenantId) {
      throw new Error(
        `Tenant on shift to update differs: expected ${shift.tenantId}, was ${toUpdate.tenantId}`
      )
    }

    const { id, shift: serialized } = serializeShift(shift)
    update(this.collection, id, serialized)
  }

  getById(tenantId: string, id: string): Observable<Shift | null> {
    return from(get(this.collection, id)).pipe(
      map((maybeShift) => {
        if (maybeShift == null || maybeShift.data.tenant != tenantId) {
          return null
        }

        return deserializeShift(id, maybeShift.data)
      })
    )
  }

  findAll(tenantId: string): Observable<readonly Shift[]> {
    return from(query(this.collection, [where('tenant', '==', tenantId)])).pipe(
      map((docs) =>
        Shift.sorted(docs.map((doc) => deserializeShift(doc.ref.id, doc.data)))
      )
    )
  }

  findMany(
    tenantId: string,
    shiftIds: readonly string[]
  ): Observable<readonly Shift[]> {
    return from(getMany(this.collection, shiftIds)).pipe(
      map((docs) =>
        Shift.sorted(
          docs
            .map((doc) => deserializeShift(doc.ref.id, doc.data))
            .filter((shift) => shift.tenantId === tenantId)
        )
      )
    )
  }

  findOnDay(tenantId: string, dayDate: DayDate): Observable<readonly Shift[]> {
    return this.findBetweenDatesInclusive(tenantId, dayDate, dayDate)
  }

  findInYear(tenantId: string, year: number): Observable<readonly Shift[]> {
    return this.findBetweenDatesInclusive(
      tenantId,
      new DayDate({ day: 1, month: 1, year }),
      new DayDate({ day: 31, month: 12, year: year + 1 })
    )
  }

  /** Returns all shifts where `from <= shift.date <= to` (i.e. shifts ∈ [from, start]) */
  findBetweenDatesInclusive(
    tenantId: string,
    fromDate: DayDate,
    toDate: DayDate
  ): Observable<readonly Shift[]> {
    return from(
      query(this.collection, [
        where('tenant', '==', tenantId),
        where('dayId', '>=', fromDate.id),
        where('dayId', '<=', toDate.id),
      ])
    ).pipe(
      map((docs) =>
        Shift.sorted(docs.map((doc) => deserializeShift(doc.ref.id, doc.data)))
      )
    )
  }
}
