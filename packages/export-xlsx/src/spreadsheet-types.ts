import { DayDate, Price } from '@hoepel.app/types'

/** Supported types for spreadsheet cells */
export type SpreadsheetCellValue =
  | string
  | number
  | boolean
  | DayDate
  | Price
  | undefined

/** Represents an Excel/spreadsheet worksheet (a "tab" in a spreadsheet) */
export interface SpreadsheetWorksheet {
  name: string

  columns: ReadonlyArray<{
    title?: SpreadsheetCellValue
    values: ReadonlyArray<SpreadsheetCellValue>
    width?: number
    hideIfNoSetValues?: boolean
  }>
}

// This interface decouples the results so they don't use SheetJS directly
// TODO should be used in all functions in this file (and then they could be refactored into classes)
export interface SpreadsheetData {
  filename?: string
  worksheets: ReadonlyArray<SpreadsheetWorksheet>
}
