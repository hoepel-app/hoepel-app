import { IEvent } from './event'

/** Something that can persist events */
export type Log = {
  /**
   * Save an event to the log
   * @returns An id that refers to the doc entry. May be null if not supported for an implementation. Intended use is correlation and debugging.
   */
  commit: (event: IEvent<string, any>) => Promise<{ id?: string }>
}
