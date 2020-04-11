import PizZip from 'pizzip'
import DocxTemplater from 'docxtemplater'
import { ZipError, TemplatingError } from './error'

const getZippedDoc = (buffer: Buffer): pizzip => {
  try {
    return new PizZip(buffer)
  } catch (err) {
    throw new ZipError(err)
  }
}

/**
 * Load a .docx file (provided as a buffer) and turn it into a Docxtemplater object
 */
export const loadDocument = (template: Buffer): docxtemplater => {
  try {
    const zip = getZippedDoc(template)

    return new DocxTemplater(zip, {
      linebreaks: true,
      nullGetter: (part) => {
        if (!part.module) {
          return '[Geen waarde gevonden]'
        }
        if (part.module === 'rawxml') {
          return ''
        }
        return ''
      },
    })
  } catch (err) {
    if (err instanceof ZipError) {
      throw err
    }

    throw new TemplatingError(err)
  }
}
