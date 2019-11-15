import { readFileSync } from 'fs'
import { rulesPath, allRules } from './generate-rules-file'

const rulesFileContents = readFileSync(rulesPath).toString()

if (rulesFileContents === allRules()) {
    process.exit(0)
} else {
    console.log('Error: rules file not up to date!')
    process.exit(1)
}
