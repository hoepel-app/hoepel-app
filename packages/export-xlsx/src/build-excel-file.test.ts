import { buildExcelFile } from './build-excel-file'
import { SpreadsheetData } from './spreadsheet-types'
import { Price, DayDate } from '@hoepel.app/types'

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
          values: [
            '',
            '',
            '',
            'Geboortedatum',
            new DayDate({
              day: 2,
              month: 3,
              year: 2014,
            }),
          ],
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
            new DayDate({
              day: 3,
              month: 4,
              year: 2019,
            }),
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
            new DayDate({
              day: 3,
              month: 4,
              year: 2019,
            }),
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
            new DayDate({
              day: 5,
              month: 8,
              year: 2019,
            }),
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

describe('buildExcelFile', () => {
  test('builds an Excel file from SpreadSheetData', () => {
    const res = buildExcelFile(spreadSheetData)

    expect(res.description).toEqual('Data fiscale attesten 2019')
    expect(res.downloadFileName).toEqual('Data fiscale attesten 2019.xlsx')
    expect(res.format).toEqual('XLSX')
    expect(res.file.length).toBeGreaterThan(15000)
  })
})
