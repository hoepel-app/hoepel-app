import { extraRules } from './extra-rules'
import { createFirestoreRulesFromSchema } from '.'
import { join } from 'path'
import { collections } from '@hoepel.app/schema-firestore'

export const allRules = (): string => createFirestoreRulesFromSchema(collections, extraRules)
export const rulesPath = join(__dirname, '../firestore.rules')
