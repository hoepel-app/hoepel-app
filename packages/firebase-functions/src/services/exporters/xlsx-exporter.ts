import * as XLSX from 'xlsx'
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  DayDate,
  DetailedAttendancesOnShift,
  DetailedAttendancesOnShifts,
  IChild,
  ICrew,
  IDetailedChildAttendance,
  IDetailedCrewAttendance,
  Price,
  Shift,
} from '@hoepel.app/types'
import { AddressService } from '../address.service'
import * as _ from 'lodash'
import { LocalFile } from './exporter'

/** Supported types for spreadsheet cells */
export type SpreadsheetCellValue = string | number | boolean | DayDate | Price

/** Represents an Excel/spreadsheet worksheet (a "tab" in a spreadsheet) */
export interface SpreadsheetWorksheet {
  name: string

  columns: ReadonlyArray<{
    values: ReadonlyArray<SpreadsheetCellValue>
    width?: number
  }>
}

// This interface decouples the results so they don't use SheetJS directly
// TODO should be used in all functions in this file (and then they could be refactored into classes)
export interface SpreadsheetData {
  filename?: string
  worksheets: ReadonlyArray<SpreadsheetWorksheet>
}

export class XlsxExporter {
  createChildList(list: ReadonlyArray<IChild>): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Alle kinderen',
          columns: [
            {
              values: ['Voornaam', ...list.map(row => row.firstName)],
              width: 20,
            },
            {
              values: ['Familienaam', ...list.map(row => row.lastName)],
              width: 25,
            },
            {
              values: [
                'Geboortedatum',
                ...list.map(row =>
                  row.birthDate ? new DayDate(row.birthDate) : undefined
                ),
              ],
              width: 15,
            },
            {
              values: [
                'Telefoonnummer',
                ...list.map(row => {
                  return row.phone
                    .map(
                      p => p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                    )
                    .join(', ')
                }),
              ],
              width: 25,
            },
            {
              values: ['Emailadres', ...list.map(row => row.email.join(', '))],
              width: 25,
            },
            {
              values: [
                'Adres',
                ...list.map(row => new Address(row.address).formatted()),
              ],
              width: 30,
            },
            {
              values: [
                'Gender',
                ...list.map(row => {
                  switch (row.gender) {
                    case 'male':
                      return 'Man'
                    case 'female':
                      return 'Vrouw'
                    case 'other':
                      return 'Anders'
                    default:
                      return ''
                  }
                }),
              ],
            },
            {
              values: [
                'Uitpasnummer',
                ...list.map(row => row.uitpasNumber || ''),
              ],
              width: 25,
            },
            {
              values: ['Opmerkingen', ...list.map(row => row.remarks)],
              width: 75,
            },
          ],
        },
      ],
      filename: 'Alle kinderen',
    }
  }

  createCrewMemberList(list: ReadonlyArray<ICrew>): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Alle animatoren',
          columns: [
            {
              values: ['Voornaam', ...list.map(row => row.firstName)],
              width: 20,
            },
            {
              values: ['Familienaam', ...list.map(row => row.lastName)],
              width: 25,
            },
            {
              values: [
                'Geboortedatum',
                ...list.map(row =>
                  row.birthDate ? new DayDate(row.birthDate) : undefined
                ),
              ],
              width: 15,
            },
            {
              values: [
                'Telefoonnummer',
                ...list.map(row => {
                  return row.phone
                    .map(
                      p => p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                    )
                    .join(', ')
                }),
              ],
              width: 25,
            },
            {
              values: ['Emailadres', ...list.map(row => row.email.join(', '))],
              width: 25,
            },
            {
              values: [
                'Adres',
                ...list.map(row => new Address(row.address).formatted()),
              ],
              width: 30,
            },
            {
              values: [
                'Actief',
                ...list.map(row => (row.active ? 'Ja' : 'Nee')),
              ],
            },
            {
              values: [
                'Rekeningnummer',
                ...list.map(row => row.bankAccount || ''),
              ],
              width: 25,
            },
            { values: ['Gestart in', ...list.map(row => row.yearStarted)] },
            {
              values: [
                'Attesten',
                ...list.map(row => {
                  if (!row.certificates) {
                    return ''
                  }

                  return [
                    row.certificates.hasPlayworkerCertificate
                      ? 'Attest animator'
                      : '',
                    row.certificates.hasTeamleaderCertificate
                      ? 'Attest hoofdanimator'
                      : '',
                    row.certificates.hasTrainerCertificate
                      ? 'Attest instructeur'
                      : '',
                  ]
                    .filter(x => x)
                    .join(', ')
                }),
              ],
              width: 35,
            },
            {
              values: ['Opmerkingen', ...list.map(row => row.remarks)],
              width: 75,
            },
          ],
        },
      ],
      filename: 'Alle animatoren',
    }
  }

  createChildrenWithCommentList(list: ReadonlyArray<IChild>): SpreadsheetData {
    const childList = this.createChildList(list)

    return {
      worksheets: [
        { ...childList.worksheets[0], name: 'Kinderen met opmerking' },
      ],
      filename: 'Kinderen met opmerking',
    }
  }

  /**
   * Create a spreadsheet showing when crew members attended
   * @param allCrew All crew members for this tenant. Crew members without attendances will not be shown
   * @param shifts All shifts in the given year
   * @param attendances Attendances by shift for every given shift
   * @param year The year this list is about
   */
  createCrewMembersAttendanceList(
    allCrew: ReadonlyArray<Crew>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [crewId: string]: IDetailedCrewAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, {}, att.attendances)
      )
    )
    const filteredCrew = Crew.sorted(allCrew).filter(
      crew => richAttendances.numberOfCrewMemberAttendances(crew.id) > 0
    )

    return {
      worksheets: [
        {
          name: `Aanwezigheden animatoren ${year}`,
          columns: [
            {
              values: [
                '',
                '',
                'Voornaam',
                ...filteredCrew.map(row => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredCrew.map(row => row.lastName),
              ],
              width: 25,
            },

            ...sortedShifts.map(shift => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredCrew.map(crew =>
                    richAttendances.didCrewMemberAttend(crew.id, shift.id)
                  ),
                ],
                width: 22,
              }
            }),
          ],
        },
      ],
      filename: `Aanwezigheden animatoren ${year}`,
    }
  }

  createChildAttendanceList(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )

    const filteredChildren = Child.sorted(allChildren).filter(
      child => richAttendances.numberOfChildAttendances(child.id) > 0
    ) // Only children with attendances

    return {
      worksheets: [
        {
          name: `Aanwezigheden kinderen ${year}`,
          columns: [
            {
              values: [
                '',
                '',
                'Voornaam',
                ...filteredChildren.map(row => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredChildren.map(row => row.lastName),
              ],
              width: 25,
            },

            ...sortedShifts.map(shift => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredChildren.map(child =>
                    richAttendances.didChildAttend(child.id, shift.id)
                  ),
                ],
                width: 22,
              }
            }),
          ],
        },
      ],
      filename: `Aanwezigheden kinderen ${year}`,
    }
  }

  createAllFiscalCertificates(
    allChildren: ReadonlyArray<Child>,
    allContacts: ReadonlyArray<ContactPerson>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )
    const sortedChildren = Child.sorted(allChildren).filter(
      child => richAttendances.numberOfChildAttendances(child.id) > 0
    )

    const spacer = ['', '', '']

    return {
      filename: `Data fiscale attesten ${year}`,
      worksheets: [
        {
          name: `Data fiscale attesten ${year}`,
          columns: [
            {
              width: 20,
              values: [
                ...spacer,
                'Voornaam',
                ...sortedChildren.map(child => child.firstName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Familienaam',
                ...sortedChildren.map(child => child.lastName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Totaal (incl. korting)',
                ...sortedChildren.map(child =>
                  richAttendances.amountPaidByChild(child.id)
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Geboortedatum',
                ...sortedChildren.map(child =>
                  child.birthDate ? new DayDate(child.birthDate) : undefined
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Contactpersoon',
                ...sortedChildren.map(child => {
                  const primaryContactPerson = child.primaryContactPerson
                    ? allContacts.find(
                        contact =>
                          contact.id ===
                          child.primaryContactPerson.contactPersonId
                      ) || null
                    : null

                  return primaryContactPerson
                    ? primaryContactPerson.fullName
                    : ''
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Straat en nummer',
                ...sortedChildren.map(child => {
                  const address =
                    AddressService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return (address.street || '') + ' ' + (address.number || '')
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Postcode',
                ...sortedChildren.map(child => {
                  const address =
                    AddressService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return address.zipCode || ''
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Stad',
                ...sortedChildren.map(child => {
                  const address =
                    AddressService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return address.city || ''
                }),
              ],
            },
            {
              width: 25,
              values: ['Dag', 'Type', 'Prijs'],
            },
            ...sortedShifts.map(shift => {
              return {
                width: 22,
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.price,
                  shift.description,
                  ...sortedChildren.map(child =>
                    richAttendances.didChildAttend(child.id, shift.id)
                  ),
                ],
              }
            }),
          ],
        },
      ],
    }
  }

  createChildrenPerDayList(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    allAttendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const detailedAttendances = new DetailedAttendancesOnShifts(
      allAttendances.map(
        detailed =>
          new DetailedAttendancesOnShift(
            detailed.shiftId,
            detailed.attendances,
            {}
          )
      )
    )

    const list = _.toPairs(_.groupBy(shifts, shift => shift.dayId))
      .map(([dayId, shiftsOnDay]) => {
        const uniqueAttendancesOnDay = detailedAttendances.uniqueChildAttendances(
          shiftsOnDay.map(shift => shift.id)
        )

        return {
          day: DayDate.fromDayId(dayId),
          shifts: shiftsOnDay,
          uniqueAttendancesOnDay,
        }
      })
      .sort((a, b) => a.day.compareTo(b.day))

    return {
      worksheets: [
        {
          name: `Unieke kinderen per dag ${year}`,
          columns: [
            { values: ['Dag', ...list.map(row => row.day)], width: 20 },
            {
              values: [
                'Aantal unieke kinderen',
                ...list.map(row => row.uniqueAttendancesOnDay),
              ],
              width: 25,
            },
          ],
        },
      ],
      filename: `Aantal unieke kinderen per dag ${year}`,
    }
  }

  buildExcelFile(data: SpreadsheetData): LocalFile {
    // Turn cell value into a sheetjs-compatible value
    const transformCellValue = (v: SpreadsheetCellValue): XLSX.CellObject => {
      if (typeof v === 'number') {
        return { v, t: 'n' }
      } else if (typeof v === 'string') {
        return { v, t: 's' }
      } else if (typeof v === 'boolean') {
        return { v: v ? 1 : 0, t: 'n' }
      } else if (v instanceof DayDate) {
        return { v: v.nativeDate, t: 'd' }
      } else if (v instanceof Price) {
        return { v: v.toString(), t: 's' } // TODO currency formatting
      } else if (v === undefined) {
        return { t: 'z' }
      } else {
        throw new Error(
          `Could not transform unsupported cell value: ${v} (type: ${typeof v})`
        )
      }
    }

    const createWorksheet = (ws: SpreadsheetWorksheet): XLSX.WorkSheet => {
      const result: XLSX.WorkSheet = {}

      ws.columns.forEach((column, columnIdx) => {
        column.values.forEach((cellValue, rowIdx) => {
          result[
            XLSX.utils.encode_cell({ c: columnIdx, r: rowIdx })
          ] = transformCellValue(cellValue)
        })
      })

      // Set column widths
      result['!cols'] = ws.columns.map(column =>
        column.width ? { wch: column.width } : {}
      )

      // Set sheet range
      const numColumns = ws.columns.length
      const numRows = Math.max(
        ...ws.columns.map(column => column.values.length)
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
}
