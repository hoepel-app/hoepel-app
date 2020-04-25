export type Message<T> = {
  /** Unique identifier for this message */
  readonly id: string

  /** E.g. 'student-enrolled', 'approve-grant-proposal-command' */
  readonly name: string

  /** Identifer which is the same for all correlated events and commands */
  readonly correlationId: string

  /** Milliseconds since UNIX epoch */
  readonly timestamp: number

  /** Identifier of the tenant. 'global' for global events, such as user registration */
  readonly tenantId: string | 'global'

  payload: T
}
