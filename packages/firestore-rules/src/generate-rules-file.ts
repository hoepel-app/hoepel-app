import { schema } from "@hoepel.app/schema"
import { extraRules } from "./extra-rules"
import { createFirestoreRulesFromSchema } from "."
import { join } from "path"

export const allRules = () => createFirestoreRulesFromSchema(schema, extraRules)
export const rulesPath = join(__dirname, '../firestore.rules')
