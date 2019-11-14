import { createFirestoreRulesFromSchema } from ".";
import { schema } from '@hoepel.app/schema'
import { extraRules } from "./extra-rules";
import { writeFileSync } from 'fs'
import { join } from 'path'

const allRules = createFirestoreRulesFromSchema(schema, extraRules)
const path = join(__dirname, '../firestore.rules')

console.log(`Writing firestore rules to ${path}`)

writeFileSync(path, allRules)
