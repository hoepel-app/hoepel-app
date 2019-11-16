import { graphqlSchema } from '@hoepel.app/schema-firestore'
import { extraRules } from './extra-rules'
import { createFirestoreRulesFromSchema } from '.'
import { join } from 'path'

export const allRules = (): string => createFirestoreRulesFromSchema(graphqlSchema, extraRules)
export const rulesPath = join(__dirname, '../firestore.rules')
