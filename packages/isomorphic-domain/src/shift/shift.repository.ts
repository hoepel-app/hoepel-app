import { Observable } from 'rxjs'
import { Shift } from '.'
import { DayDate } from '@hoepel.app/types'

export type SerializedShift = {
  readonly dayId: string
  readonly price: {
    readonly euro: number
    readonly cents: number
  }
  readonly childrenCanBePresent: boolean
  readonly crewCanBePresent: boolean
  readonly kind: string
  readonly location?: string
  readonly description?: string
  readonly startAndEnd: {
    readonly start: {
      readonly hour: number
      readonly minute: number
    }
    end: {
      readonly hour: number
      readonly minute: number
    }
  }
  readonly tenant: string
}

// TODO should be moved to infrastructure layer
export const serializeShift = (
  shift: Shift
): { shift: SerializedShift; id: string } => {
  return {
    id: shift.id,
    shift: {
      dayId: shift.date.id,
      price: {
        euro: shift.price.euro,
        cents: shift.price.cents,
      },
      childrenCanBePresent: shift.childrenCanAttend,
      crewCanBePresent: shift.crewCanAttend,
      kind: shift.presetName,
      tenant: shift.tenantId,
      description: shift.description,
      location: shift.location,
      startAndEnd: {
        start: {
          hour: shift.startAndEnd.start.hour,
          minute: shift.startAndEnd.start.minute,
        },
        end: {
          hour: shift.startAndEnd.end.hour,
          minute: shift.startAndEnd.end.minute,
        },
      },
    },
  }
}

// TODO should be moved to infrastructure layer
export const deserializeShift = (
  shiftId: string,
  serialized: SerializedShift
): Shift => {
  const startMinutesSinceMidnight =
    serialized.startAndEnd.start.hour * 60 + serialized.startAndEnd.start.minute
  const endMinutesSinceMidnight =
    serialized.startAndEnd.end.hour * 60 + serialized.startAndEnd.end.minute

  return Shift.fromProps({
    id: shiftId,
    dayId: serialized.dayId,
    childrenCanAttend: serialized.childrenCanBePresent,
    crewCanAttend: serialized.crewCanBePresent,
    description: serialized.description ?? '',
    location: serialized.location ?? '',
    priceCents: serialized.price.euro * 100 + serialized.price.cents,
    tenantId: serialized.tenant,
    presetName: serialized.kind,
    startMinutesSinceMidnight,
    endMinutesSinceMidnight,
  })
}

export type ShiftRepository = {
  findAll(tenantId: string): Observable<readonly Shift[]>

  findMany(
    tenantId: string,
    shiftIds: readonly string[]
  ): Observable<readonly Shift[]>

  findOnDay(tenantId: string, day: DayDate): Observable<readonly Shift[]>

  /** Returns all shifts where `from <= shift.date <= to` (i.e. shifts ∈ [from, start]) */
  findBetweenDatesInclusive(
    tenantId: string,
    fromDate: DayDate,
    toDate: DayDate
  ): Observable<readonly Shift[]>

  findInYear(tenantId: string, year: number): Observable<readonly Shift[]>

  getById(tenantId: string, id: string): Observable<Shift | null>

  update(newShift: Shift): Promise<void>

  create(newShift: Shift): Promise<void>

  delete(tenantId: string, shiftId: string): Promise<void>
}
