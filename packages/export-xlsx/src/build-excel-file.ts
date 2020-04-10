import { LocalFile } from './local-file'
import * as XLSX from 'xlsx'
import {
  SpreadsheetData,
  SpreadsheetCellValue,
  SpreadsheetWorksheet,
  SpreadsheetWorksheetColumn,
} from './spreadsheet-types'
import { DayDate, Price } from '@hoepel.app/types'

export const buildExcelFile = (data: SpreadsheetData): LocalFile => {
  // Turn cell value into a sheetjs-compatible value
  const transformCellValue = (v: SpreadsheetCellValue): XLSX.CellObject => {
    if (typeof v === 'number') {
      return { v, t: 'n' }
    } else if (typeof v === 'string') {
      return { v, t: 's' }
    } else if (typeof v === 'boolean') {
      return { v: v ? 1 : 0, t: 'n' }
    } else if (v instanceof DayDate) {
      return {
        v: v.nativeDate,
        t: 'd',
      }
    } else if (v instanceof Price) {
      return { v: v.toString(), t: 's' } // TODO currency formatting
    } else if (v == null) {
      return { t: 'z' }
    } else {
      throw new Error(
        `Could not transform unsupported cell value: ${v} (type: ${typeof v})`
      )
    }
  }

  const columnShouldBeDropped = (
    column: SpreadsheetWorksheetColumn
  ): boolean => {
    return (
      column.hideIfNoSetValues === true &&
      column.values.filter(value => value != null && value !== '').length === 0
    )
  }

  const createWorksheet = (ws: SpreadsheetWorksheet): XLSX.WorkSheet => {
    const result: XLSX.WorkSheet = {}

    const filteredColumns = ws.columns.filter(
      column => !columnShouldBeDropped(column)
    )

    filteredColumns.forEach((column, columnIdx) => {
      const columnValues =
        column.title == null ? column.values : [column.title, ...column.values]

      columnValues.forEach((cellValue, rowIdx) => {
        result[
          XLSX.utils.encode_cell({ c: columnIdx, r: rowIdx })
        ] = transformCellValue(cellValue)
      })
    })

    // Set column widths
    result['!cols'] = filteredColumns.map(column =>
      column.width ? { wch: column.width } : {}
    )

    // Set sheet range
    const numColumns = filteredColumns.length
    const numRows = Math.max(
      ...filteredColumns.map(column => column.values.length)
    )
    result['!ref'] =
      XLSX.utils.encode_cell({ c: 0, r: 0 }) +
      ':' +
      XLSX.utils.encode_cell({ c: numColumns + 1, r: numRows + 1 })

    return result
  }

  const workbook = XLSX.utils.book_new()

  data.worksheets.forEach(worksheet => {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorksheet(worksheet),
      worksheet.name
    )
  })

  const file = XLSX.write(workbook, {
    bookType: 'xlsx',
    bookSST: false,
    type: 'buffer',
  })

  return {
    format: 'XLSX',
    description: data.filename,
    downloadFileName: data.filename + '.xlsx',
    file,
  }
}
