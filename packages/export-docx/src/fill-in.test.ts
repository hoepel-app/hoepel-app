import { readFileSync } from 'fs'
import { join } from 'path'
import { fillIn } from './fill-in'
import { exampleData } from './example-data'
import PizZip from 'pizzip'

describe('filling in a Docx template', () => {
  it('result is a Buffer', () => {
    const template = readFileSync(
      join(__dirname, '../test-assets/template_bewijsje_mutualiteit.docx')
    )

    const result = fillIn(template, exampleData)

    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('outputs zip with expected files', () => {
    const template = readFileSync(
      join(__dirname, '../test-assets/template_bewijsje_mutualiteit.docx')
    )

    const result = fillIn(template, exampleData)

    const zip = new PizZip(result)
    const filesInZip = zip.filter(() => true).map((file) => file.name)

    expect(filesInZip).toMatchInlineSnapshot(`
      Array [
        "_rels/.rels",
        "docProps/custom.xml",
        "docProps/core.xml",
        "docProps/app.xml",
        "word/_rels/document.xml.rels",
        "word/styles.xml",
        "word/footnotes.xml",
        "word/settings.xml",
        "word/document.xml",
        "word/theme/theme1.xml",
        "word/fontTable.xml",
        "[Content_Types].xml",
        "docProps/",
        "word/",
      ]
    `)
  })

  it('output matches snapshot', () => {
    const template = readFileSync(
      join(__dirname, '../test-assets/template_bewijsje_mutualiteit.docx')
    )

    const result = fillIn(template, exampleData)
    writeFileSync('filled.docx', result)

    const zip = new PizZip(result)
    const fileContent = zip.filter(() => true).map((file) => file.asText())

    expect(fileContent).toMatchSnapshot()
  })

  it('throws for invalid input file', () => {
    expect(() =>
      fillIn(Buffer.from([]), exampleData)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Error while loading DOCX as a ZIP file: End of data reached (data length = 0, asked index = 4). Corrupted zip ?"`
    )
  })

  it('throws for input file with unclosed tags', () => {
    const fileWithUnclosedTags = readFileSync(
      join(__dirname, '../test-assets/template_invalid_tags.docx')
    )

    expect(() =>
      fillIn(fileWithUnclosedTags, exampleData)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Error while filling out template: Multi error; The tag beginning with \\"{organisat\\" is unclosed, The tag beginning with \\"}Concrete \\" is unopened, The tag beginning with \\"{prijs_per\\" is unclosed"`
    )
  })
})
