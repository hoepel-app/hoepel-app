import { CertificateTemplateFillInData } from './data'
import { loadDocument } from './load-document'
import { TemplatingError, ZipError } from './error'

/**
 * Fill in a document and return it as a buffer
 * @param docx A .docx file, loaded into a Buffer
 */
export const fillIn = (
  docx: Buffer,
  data: CertificateTemplateFillInData
): Buffer => {
  try {
    const doc = loadDocument(docx)
    doc.setData(data)
    doc.render()
    return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
  } catch (error) {
    if (error instanceof ZipError || error instanceof TemplatingError) {
      throw error
    }

    throw new TemplatingError(error)
  }
}
