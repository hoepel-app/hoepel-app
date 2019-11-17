import { writeFileSync } from 'fs'
import { rulesPath, allRules } from '../generate-rules-file'

console.log(`Writing firestore rules to ${rulesPath}`)

writeFileSync(rulesPath, allRules())
