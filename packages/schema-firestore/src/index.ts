import { schema } from '@hoepel.app/schema'
import { parse } from 'graphql'
import { getFirestoreCollections } from './schema-to-firestore';

export const collections = getFirestoreCollections(parse(schema))
export * from './firestore'
