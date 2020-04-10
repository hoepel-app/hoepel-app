import { XlsxExporter } from './xlsx-exporter'
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  Price,
  Shift,
  DayDate,
} from '@hoepel.app/types'

describe('XlsxExporter', () => {
  const exporter = new XlsxExporter()

  const child1 = Child.empty()
    .withFirstName('Kind 1')
    .withLastName('Achter')
    .withId('child-id-1')
    .withBirthDate({ day: 2, month: 3, year: 2014 })
    .withPhoneContact([
      { phoneNumber: '+1111' },
      { phoneNumber: '+2222', comment: 'comment' },
    ])
    .withEmail(['aoeu@test.com', 'test@hello.com'])
    .withGender('male')
    .withUitpasNumber('11-1111-11')
    .withRemarks('Remarks here')
    .withAddress(
      new Address({
        street: 'Straat',
        number: '12A',
        city: 'Stad',
        zipCode: 4444,
      })
    )
  const child2 = Child.empty()
    .withFirstName('Kind 2')
    .withLastName('Achter')
    .withId('child-id-2')
    .withContactPeople([
      { relationship: 'Mama', contactPersonId: 'contact-id-1' },
    ])
  const child3 = Child.empty()
    .withFirstName('Kind 3')
    .withLastName('Achter')
    .withId('child-id-3')

  const crew1 = Crew.empty()
    .withId('crew-id-1')
    .withFirstName('Animator 1')
    .withLastName('Achernaam')
    .withBirthDate({ day: 2, month: 3, year: 2014 })
    .withPhoneContact([
      { phoneNumber: '+2132' },
      { phoneNumber: '+4321', comment: 'comment' },
    ])
    .withEmail(['aoeu@test.com', 'hello@example.com'])
    .withAddress(
      new Address({
        street: 'Straat',
        number: '12A',
        city: 'Stad',
        zipCode: 4444,
      })
    )
    .withActive(false)
    .withBankAccount('BE44 4444 4444')
    .withYearStarted(2019)
    .withCertificates({
      hasPlayworkerCertificate: true,
      hasTeamleaderCertificate: true,
      hasTrainerCertificate: true,
    })
    .withRemarks('Remarks here')
  const crew2 = Crew.empty()
    .withId('crew-id-2')
    .withFirstName('Animator 2')
    .withLastName('Achernaam')
    .withCertificates({
      hasPlayworkerCertificate: true,
      hasTrainerCertificate: false,
      hasTeamleaderCertificate: false,
    })
  const crew3 = Crew.empty()
    .withId('crew-id-3')
    .withFirstName('Animator 3')
    .withLastName('Achernaam')

  const shift1 = new Shift({
    id: 'shift-id-1',
    childrenCanBePresent: true,
    crewCanBePresent: true,
    dayId: '2019-04-03',
    price: new Price({ euro: 5, cents: 50 }),
    kind: 'Voormiddag',
    description: 'Omschrijving 1',
    startAndEnd: {
      start: { hour: 9, minute: 0 },
      end: { hour: 12, minute: 0 },
    },
  })
  const shift2 = new Shift({
    id: 'shift-id-2',
    childrenCanBePresent: true,
    crewCanBePresent: true,
    dayId: '2019-04-03',
    price: new Price({ euro: 2, cents: 50 }),
    kind: 'Namiddag',
    description: 'Omschrijving 2',
    startAndEnd: {
      start: { hour: 13, minute: 0 },
      end: { hour: 17, minute: 30 },
    },
  })
  const shift3 = new Shift({
    id: 'shift-id-4',
    childrenCanBePresent: true,
    crewCanBePresent: true,
    dayId: '2019-08-05',
    price: new Price({ euro: 20, cents: 0 }),
    kind: 'Externe activiteit',
    description: 'Bellewaerde met de tieners',
  })

  const contactPerson1 = ContactPerson.empty()
    .withId('contact-id-1')
    .withFirstName('Mieke')
    .withLastName('Contact')
    .withAddress({
      street: 'Contactstraat',
      number: '123',
      zipCode: 7777,
      city: 'Stadt',
    })
  const contactPerson2 = ContactPerson.empty()
    .withId('contact-id-2')
    .withFirstName('Mieke')
    .withLastName('Contact')

  it('createChildList', () => {
    const res = exporter.createChildList([child1, child2, child3])

    expect(res.filename).toBe('Alle kinderen')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Alle kinderen')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createChildrenWithCommentList', () => {
    const res = exporter.createChildrenWithCommentList([child1])

    expect(res.filename).toBe('Kinderen met opmerking')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Kinderen met opmerking')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createCrewMemberList', () => {
    const res = exporter.createCrewMemberList([crew1, crew2, crew3])

    expect(res.filename).toBe('Alle animatoren')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Alle animatoren')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createCrewMembersAttendanceList', () => {
    const res = exporter.createCrewMembersAttendanceList(
      [crew1, crew2, crew3],
      [shift2, shift1, shift3],
      [
        {
          shiftId: 'shift-id-2',
          attendances: {
            'crew-id-2': { didAttend: true },
            'crew-id-1': { didAttend: true },
            'crew-id-3': { didAttend: false },
          },
        },
        {
          shiftId: 'shift-id-1',
          attendances: { 'crew-id-1': { didAttend: true } },
        },
      ],
      2019
    )

    expect(res.filename).toBe('Aanwezigheden animatoren 2019')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Aanwezigheden animatoren 2019')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createChildAttendanceList', () => {
    const res = exporter.createChildAttendanceList(
      [child1, child2, child3],
      [shift2, shift1, shift3],
      [
        {
          shiftId: 'shift-id-2',
          attendances: {
            'child-id-2': {
              didAttend: true,
              amountPaid: { euro: 5, cents: 0 },
            },
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 6, cents: 0 },
            },
            'child-id-3': {
              didAttend: false,
              amountPaid: { euro: 2, cents: 50 },
            },
          },
        },
        {
          shiftId: 'shift-id-1',
          attendances: {
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 7, cents: 20 },
            },
          },
        },
      ],
      2019
    )

    expect(res.filename).toBe('Aanwezigheden kinderen 2019')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Aanwezigheden kinderen 2019')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createDayOverview', () => {
    const res = exporter.createDayOverview(
      [child1, child2, child3],
      [shift2, shift1, shift3],
      [
        {
          shiftId: 'shift-id-2',
          attendances: {
            'child-id-2': {
              didAttend: true,
              amountPaid: { euro: 5, cents: 0 },
            },
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 6, cents: 0 },
            },
            'child-id-3': {
              didAttend: false,
              amountPaid: { euro: 2, cents: 50 },
              ageGroupName: 'Kleuters',
            },
          },
        },
        {
          shiftId: 'shift-id-1',
          attendances: {
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 7, cents: 20 },
              ageGroupName: 'Tieners',
            },
          },
        },
      ],
      new DayDate({ year: 2019, month: 4, day: 3 })
    )

    expect(res.filename).toBe('Overzicht voor 03-04-2019')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Aanwezigheden kinderen')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createAllFiscalCertificates', () => {
    const res = exporter.createAllFiscalCertificates(
      [child1, child2, child3],
      [contactPerson1, contactPerson2],
      [shift2, shift1, shift3],
      [
        {
          shiftId: 'shift-id-2',
          attendances: {
            'child-id-2': {
              didAttend: true,
              amountPaid: { euro: 5, cents: 0 },
            },
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 6, cents: 0 },
            },
            'child-id-3': {
              didAttend: false,
              amountPaid: { euro: 2, cents: 50 },
            },
          },
        },
        {
          shiftId: 'shift-id-1',
          attendances: {
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 7, cents: 20 },
            },
          },
        },
      ],
      2019
    )

    expect(res.filename).toBe('Data fiscale attesten 2019')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Data fiscale attesten 2019')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })

  it('createChildrenPerDayList', () => {
    const res = exporter.createChildrenPerDayList(
      [shift2, shift1, shift3],
      [
        {
          shiftId: 'shift-id-2',
          attendances: {
            'child-id-2': {
              didAttend: true,
              amountPaid: { euro: 5, cents: 0 },
            },
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 6, cents: 0 },
            },
            'child-id-3': {
              didAttend: false,
              amountPaid: { euro: 2, cents: 50 },
            },
          },
        },
        {
          shiftId: 'shift-id-1',
          attendances: {
            'child-id-1': {
              didAttend: true,
              amountPaid: { euro: 7, cents: 20 },
            },
          },
        },
      ],
      2019
    )

    expect(res.filename).toBe('Aantal unieke kinderen per dag 2019')
    expect(res.worksheets).toHaveLength(1)
    expect(res.worksheets[0].name).toBe('Unieke kinderen per dag 2019')
    expect(res.worksheets[0].name.length).toBeLessThan(31) // Excel worksheet names must be <31 characters

    expect(res).toMatchSnapshot()
  })
})
