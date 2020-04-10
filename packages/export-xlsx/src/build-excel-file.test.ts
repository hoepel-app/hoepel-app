import { buildExcelFile } from './build-excel-file'
import { SpreadsheetData } from './spreadsheet-types'
import { Price, DayDate } from '@hoepel.app/types'
import { read } from 'xlsx'

const spreadSheetData: SpreadsheetData = {
  filename: 'Data fiscale attesten 2019',
  worksheets: [
    {
      columns: [
        {
          values: ['', '', '', 'Voornaam', 'Kind 1', 'Kind 2'],
          width: 20,
        },
        {
          values: ['', '', '', 'Familienaam', 'Achter', 'Achter'],
          width: 25,
        },
        {
          values: [
            '',
            '',
            '',
            'Totaal (incl. korting)',
            new Price({
              cents: 20,
              euro: 13,
            }),
            new Price({
              cents: 0,
              euro: 5,
            }),
          ],
          width: 25,
        },
        {
          values: ['', '', '', 'Geboortedatum', 'My date'],
          width: 25,
        },
        {
          values: ['', '', '', 'Contactpersoon', '', 'Mieke Contact'],
          width: 25,
        },
        {
          values: [
            '',
            '',
            '',
            'Straat en nummer',
            'Straat 12A',
            'Contactstraat 123',
          ],
          width: 25,
        },
        {
          values: ['', '', '', 'Postcode', 4444, 7777],
          width: 25,
        },
        {
          values: ['', '', '', 'Stad', 'Stad', 'Stadt'],
          width: 25,
        },
        {
          values: ['Dag', 'Type', 'Prijs'],
          width: 25,
        },
        {
          values: [
            'A date here',
            'Voormiddag',
            new Price({
              cents: 50,
              euro: 5,
            }),
            'Omschrijving 1',
            true,
            false,
          ],
          width: 22,
        },
        {
          values: [
            'Here goes date',
            'Namiddag',
            new Price({
              cents: 50,
              euro: 2,
            }),
            'Omschrijving 2',
            true,
            true,
          ],
          width: 22,
        },
        {
          values: [
            'Some date here',
            'Externe activiteit',
            new Price({
              cents: 0,
              euro: 20,
            }),
            'Bellewaerde met de tieners',
            false,
            false,
          ],
          width: 22,
        },
      ],
      name: 'Data fiscale attesten 2019',
    },
  ],
}

const differentTypes: SpreadsheetData = {
  filename: 'Different types',
  worksheets: [
    {
      columns: [
        {
          title: 'A string',
          values: [
            true,
            false,
            'Now for some numbers',
            0,
            1000,
            3.14,
            undefined,
            'And a few prices',
            Price.zero,
            new Price({ euro: 2, cents: 50 }),
          ],
          width: 20,
        },
      ],
      name: 'Data fiscale attesten 2019',
    },
  ],
}

describe('buildExcelFile', () => {
  test('builds an Excel file from SpreadSheetData', () => {
    const res = buildExcelFile(spreadSheetData)

    expect(res.description).toEqual('Data fiscale attesten 2019')
    expect(res.downloadFileName).toEqual('Data fiscale attesten 2019.xlsx')
    expect(res.format).toEqual('XLSX')
    expect(res.file.length).toBeGreaterThan(15000)
  })

  test('built Excel file contains expected data', () => {
    const res = buildExcelFile(spreadSheetData)
    const readFile = read(res.file)

    expect(readFile).toMatchSnapshot()
  })

  test('serializes string, numbers, booleans, prices and undefineds', () => {
    const res = buildExcelFile(differentTypes)
    const readFile = read(res.file)

    expect(readFile).toMatchSnapshot()
  })

  test('serializes dates', () => {
    const res = buildExcelFile({
      worksheets: [
        {
          name: 'My Worksheet',
          columns: [{ values: [DayDate.fromISO8601('2020-08-23')] }],
        },
      ],
    })
    const readFile = read(res.file)

    // As by https://www.npmjs.com/package/xlsx#dates:
    // > Excel has no native concept of universal time
    // > All times are specified in the local time zone.
    // > Excel limitations prevent specifying true absolute dates.
    expect(readFile.Sheets['My Worksheet']['A1']['w']).toBe('8/23/20')
    expect(readFile.Sheets['My Worksheet']['A1']['t']).toBe('n')
    expect(typeof readFile.Sheets['My Worksheet']['A1']['v']).toBe('number')
  })
})
