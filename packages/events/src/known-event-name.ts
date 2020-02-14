import { FirebaseAuthUserCreated, FirebaseAuthUserDeleted } from './events'
import { IEvent } from '@hoepel.app/events-framework/src'

/** TypeScript helper that can extract names from events */
type extractName<Type> = Type extends IEvent<infer NAME, infer T> ? NAME : never

/** Known events for hoepel.app. Can be used for applicators or switch statements */
export type KnownEventName =
  | extractName<FirebaseAuthUserCreated>
  | extractName<FirebaseAuthUserDeleted>
