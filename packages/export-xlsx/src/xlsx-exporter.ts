/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
} from '@hoepel.app/types'
import { AddressDomainService } from '@hoepel.app/domain'
import {
  Shift,
  WeekIdentifier,
  ChildAttendanceIntention,
} from '@hoepel.app/isomorphic-domain'
import { SpreadsheetData } from './spreadsheet-types'
import groupBy from 'lodash.groupby'
import flatMap from 'lodash.flatmap'

export class XlsxExporter {
  createChildList(
    list: readonly {
      child: IChild
      parent: null | { displayName: string | null; email: string }
    }[]
  ): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Alle kinderen',
          columns: [
            {
              title: 'Voornaam',
              values: list.map(({ child }) => child.firstName),
              width: 20,
            },
            {
              title: 'Familienaam',
              values: list.map(({ child }) => child.lastName),
              width: 25,
            },
            {
              title: 'Geboortedatum',
              values: list.map(({ child }) =>
                child.birthDate ? new DayDate(child.birthDate) : undefined
              ),
              width: 15,
            },
            {
              title: 'Telefoonnummer',
              values: list.map(({ child }) => {
                return child.phone
                  .map(
                    (p) => p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                  )
                  .join(', ')
              }),
              width: 25,
            },
            {
              title: 'Geregistreerd door',
              values: list.map(({ parent }) => parent?.displayName ?? ''),
              width: 25,
            },
            {
              title: 'Geregistreerd door (emailadres)',
              values: list.map(({ parent }) => parent?.email ?? ''),
              width: 25,
            },
            {
              title: 'Emailadres',
              values: list.map(({ child }) => child.email.join(', ')),
              width: 25,
            },
            {
              title: 'Adres',
              values: list.map(({ child }) =>
                new Address(child.address).formatted()
              ),
              width: 30,
            },
            {
              title: 'Gender',
              values: list.map(({ child }) => {
                switch (child.gender) {
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
            },
            {
              title: 'Uitpasnummer',
              values: list.map(({ child }) => child.uitpasNumber || ''),
              width: 25,
            },
            {
              title: 'Opmerkingen',
              values: list.map(({ child }) => child.remarks),
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
              title: 'Voornaam',
              values: list.map((row) => row.firstName),
              width: 20,
            },
            {
              title: 'Familienaam',
              values: list.map((row) => row.lastName),
              width: 25,
            },
            {
              title: 'Geboortedatum',
              values: list.map((row) =>
                row.birthDate ? new DayDate(row.birthDate) : undefined
              ),
              width: 15,
            },
            {
              title: 'Telefoonnummer',
              values: [
                ...list.map((row) => {
                  return row.phone
                    .map(
                      (p) =>
                        p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                    )
                    .join(', ')
                }),
              ],
              width: 25,
            },
            {
              title: 'Emailadres',
              values: list.map((row) => row.email.join(', ')),
              width: 25,
            },
            {
              title: 'Adres',
              values: list.map((row) => new Address(row.address).formatted()),
              width: 30,
            },
            {
              title: 'Actief',
              values: list.map((row) => (row.active ? 'Ja' : 'Nee')),
            },
            {
              title: 'Rekeningnummer',
              values: list.map((row) => row.bankAccount || ''),
              width: 25,
            },
            {
              title: 'Gestart in',
              values: list.map((row) => row.yearStarted),
            },
            {
              title: 'Attesten',
              values: list.map((row) => {
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
                  .filter((x) => x)
                  .join(', ')
              }),
              width: 35,
            },
            {
              title: 'Opmerkingen',
              values: list.map((row) => row.remarks),
              width: 75,
            },
          ],
        },
      ],
      filename: 'Alle animatoren',
    }
  }

  createChildrenWithCommentList(
    list: readonly {
      child: IChild
      parent: null | { displayName: string | null; email: string }
    }[]
  ): SpreadsheetData {
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
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        (att) =>
          new DetailedAttendancesOnShift(att.shiftId, {}, att.attendances)
      )
    )
    const filteredCrew = Crew.sorted(allCrew).filter(
      (crew) => richAttendances.numberOfCrewMemberAttendances(crew.id!) > 0
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
                ...filteredCrew.map((row) => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredCrew.map((row) => row.lastName),
              ],
              width: 25,
            },

            ...shifts.map((shift) => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredCrew.map((crew) =>
                    richAttendances.didCrewMemberAttend(crew.id!, shift.id!)
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

  /**
   * Create a spreadsheet showing information for a specific day
   * @param allChildren All crew members for this tenant
   * @param shifts All shifts on day
   * @param childAttendances Child attendances for the given shifts
   * @param day The day for which this spreadsheet is requested
   */
  createDayOverview(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    childAttendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    day: DayDate
  ): SpreadsheetData {
    const relevantShifts = shifts.filter(
      (shift) => shift.dayId === day.toDayId()
    )

    const rows: {
      firstName: string
      lastName: string
      ageGroupName?: string
      shift: Shift
    }[] = flatMap(
      relevantShifts.map((shift) => {
        const childAttendancesForShift =
          childAttendances.find((att) => att.shiftId === shift.id)
            ?.attendances ?? {}
        const richAttendances = new DetailedAttendancesOnShift(
          shift.id!,
          childAttendancesForShift,
          {}
        )

        const filteredChildren = richAttendances
          .attendingChildren()
          .map((childId) => allChildren.find((child) => child.id === childId))
          .filter((child) => child != null) as readonly Child[]

        return filteredChildren.map((child) => {
          return {
            firstName: child.firstName,
            lastName: child.lastName,
            ageGroupName: childAttendancesForShift[child.id!]?.ageGroupName,
            shift,
          }
        })
      })
    )

    return {
      filename: `Overzicht voor ${day.toDDMMYYYY('-')}`,
      worksheets: [
        {
          name: 'Aanwezigheden kinderen',
          columns: [
            {
              title: 'Voornaam',
              values: rows.map((row) => row.firstName),
              width: 20,
            },
            {
              title: 'Achternaam',
              values: rows.map((row) => row.lastName),
              width: 25,
            },
            {
              title: 'Leeftijdsgroep',
              values: rows.map((row) => row.ageGroupName),
              width: 20,
              hideIfNoSetValues: true,
            },
            {
              title: 'Soort',
              values: rows.map((row) => row.shift.kind),
              width: 20,
            },
            {
              title: 'Beschrijving',
              values: rows.map((row) => row.shift.description),
              width: 25,
              hideIfNoSetValues: true,
            },
            {
              title: 'Locatie',
              values: rows.map((row) => row.shift.location),
              width: 25,
              hideIfNoSetValues: true,
            },
          ],
        },
      ],
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
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        (att) =>
          new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )

    const filteredChildren = Child.sorted(allChildren).filter(
      (child) => richAttendances.numberOfChildAttendances(child.id!) > 0
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
                ...filteredChildren.map((row) => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredChildren.map((row) => row.lastName),
              ],
              width: 25,
            },

            ...shifts.map((shift) => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredChildren.map((child) =>
                    richAttendances.didChildAttend(child.id!, shift.id!)
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
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        (att) =>
          new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )
    const sortedChildren = Child.sorted(allChildren).filter(
      (child) => richAttendances.numberOfChildAttendances(child.id!) > 0
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
                ...sortedChildren.map((child) => child.firstName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Familienaam',
                ...sortedChildren.map((child) => child.lastName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Totaal (incl. korting)',
                ...sortedChildren.map((child) =>
                  richAttendances.amountPaidByChild(child.id!)
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Geboortedatum',
                ...sortedChildren.map((child) =>
                  child.birthDate ? new DayDate(child.birthDate) : undefined
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Contactpersoon',
                ...sortedChildren.map((child) => {
                  const primaryContactPerson = child.primaryContactPerson
                    ? allContacts.find(
                        (contact) =>
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
                ...sortedChildren.map((child) => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
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
                ...sortedChildren.map((child) => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
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
                ...sortedChildren.map((child) => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
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
            ...shifts.map((shift) => {
              return {
                width: 22,
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.price,
                  shift.description,
                  ...sortedChildren.map((child) =>
                    richAttendances.didChildAttend(child.id!, shift.id!)
                  ),
                ],
              }
            }),
          ],
        },
      ],
    }
  }

  createChildAttendanceIntentionList(
    list: readonly {
      attendance: ChildAttendanceIntention
      week: WeekIdentifier
      child: Child | null
      parent: null | {
        displayName: string | null
        email: string
      }
      bubbleName: string | null
      shift: Shift | null
    }[]
  ): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Inschrijvingen',
          columns: [
            {
              title: 'Voornaam',
              values: list.map(({ child }) => child?.firstName),
              width: 20,
            },
            {
              title: 'Familienaam',
              values: list.map(({ child }) => child?.lastName),
              width: 25,
            },
            {
              title: 'Dag',
              width: 15,
              values: list.map(({ shift }) => shift?.date?.toDDMMYYYY()),
            },
            {
              title: 'Activiteit',
              width: 15,
              values: list.map(({ shift }) => shift?.kind),
            },
            {
              title: 'Status',
              width: 25,
              values: list.map(({ attendance }) => {
                switch (attendance.status) {
                  case 'accepted':
                    return 'Aanvaard'
                  case 'rejected':
                    return 'Geweigerd'
                  case 'pending':
                    return 'Nog niet aanvaard/geweigerd'
                  default:
                    return ''
                }
              }),
            },
            {
              title: 'Bubbel',
              values: list.map(({ bubbleName }) => bubbleName || ''),
              width: 20,
            },
            {
              title: 'Naam ouder',
              values: list.map(({ parent }) => parent?.displayName || ''),
              width: 20,
            },
            {
              title: 'Email ouder',
              values: list.map(({ parent }) => parent?.email || ''),
              width: 20,
            },
          ],
        },
      ],
      filename: 'Inschrijvingen',
    }
  }

  createBubbleAssignmentList(
    children: readonly {
      week: WeekIdentifier
      bubbleName: string
      child: Child
    }[]
  ): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Bubbels',
          columns: [
            {
              title: 'Voornaam',
              values: children.map(({ child }) => child.firstName),
              width: 20,
            },
            {
              title: 'Familienaam',
              values: children.map(({ child }) => child.lastName),
              width: 25,
            },
            {
              title: 'Week',
              values: children.map(({ week }) => week.range.from.toDDMMYYYY()),
              width: 20,
            },
            {
              title: 'Bubbel',
              values: children.map(({ bubbleName }) => bubbleName),
              width: 20,
            },
          ],
        },
      ],
      filename: 'Bubbels',
    }
  }

  createChildrenPerDayList(
    shifts: ReadonlyArray<Shift>,
    allAttendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const detailedAttendances = new DetailedAttendancesOnShifts(
      allAttendances.map(
        (detailed) =>
          new DetailedAttendancesOnShift(
            detailed.shiftId,
            detailed.attendances,
            {}
          )
      )
    )

    const list = Object.entries(groupBy(shifts, (shift) => shift.dayId))
      .map(([dayId, shiftsOnDay]) => {
        const uniqueAttendancesOnDay = detailedAttendances.uniqueChildAttendances(
          shiftsOnDay.map((shift) => shift.id)
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
            { title: 'Dag', values: list.map((row) => row.day), width: 20 },
            {
              title: 'Aantal unieke kinderen',
              values: list.map((row) => row.uniqueAttendancesOnDay),
              width: 25,
            },
          ],
        },
      ],
      filename: `Aantal unieke kinderen per dag ${year}`,
    }
  }
}
