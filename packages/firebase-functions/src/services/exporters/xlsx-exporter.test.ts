import { expect } from 'chai'
import { XlsxExporter } from './xlsx-exporter'
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  Price,
  Shift,
} from '@hoepel.app/types'

describe('XlsxExporter', async () => {
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

    expect(res.filename).to.equal('Alle kinderen')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Alle kinderen')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const childListExpected = [
      { values: ['Voornaam', 'Kind 1', 'Kind 2', 'Kind 3'], width: 20 },
      { values: ['Familienaam', 'Achter', 'Achter', 'Achter'], width: 25 },
      {
        values: [
          'Geboortedatum',
          { day: 2, month: 3, year: 2014 },
          undefined,
          undefined,
        ],
        width: 15,
      },
      {
        values: ['Telefoonnummer', '+1111, +2222 (comment)', '', ''],
        width: 25,
      },
      {
        values: ['Emailadres', 'aoeu@test.com, test@hello.com', '', ''],
        width: 25,
      },
      { values: ['Adres', 'Straat 12A, 4444 Stad', '', ''], width: 30 },
      { values: ['Gender', 'Man', '', ''] },
      { values: ['Uitpasnummer', '11-1111-11', '', ''], width: 25 },
      { values: ['Opmerkingen', 'Remarks here', '', ''], width: 75 },
    ]

    expect(res.worksheets[0].columns).to.eql(childListExpected)
  })

  it('createChildrenWithCommentList', () => {
    const res = exporter.createChildrenWithCommentList([child1])

    expect(res.filename).to.equal('Kinderen met opmerking')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Kinderen met opmerking')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const childListExpected = [
      { values: ['Voornaam', 'Kind 1'], width: 20 },
      { values: ['Familienaam', 'Achter'], width: 25 },
      {
        values: ['Geboortedatum', { day: 2, month: 3, year: 2014 }],
        width: 15,
      },
      { values: ['Telefoonnummer', '+1111, +2222 (comment)'], width: 25 },
      { values: ['Emailadres', 'aoeu@test.com, test@hello.com'], width: 25 },
      { values: ['Adres', 'Straat 12A, 4444 Stad'], width: 30 },
      { values: ['Gender', 'Man'] },
      { values: ['Uitpasnummer', '11-1111-11'], width: 25 },
      { values: ['Opmerkingen', 'Remarks here'], width: 75 },
    ]

    expect(res.worksheets[0].columns).to.eql(childListExpected)
  })

  it('createCrewMemberList', () => {
    const res = exporter.createCrewMemberList([crew1, crew2, crew3])

    expect(res.filename).to.equal('Alle animatoren')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Alle animatoren')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const crewListExpected = [
      {
        values: ['Voornaam', 'Animator 1', 'Animator 2', 'Animator 3'],
        width: 20,
      },
      {
        values: ['Familienaam', 'Achernaam', 'Achernaam', 'Achernaam'],
        width: 25,
      },
      {
        values: [
          'Geboortedatum',
          { day: 2, month: 3, year: 2014 },
          undefined,
          undefined,
        ],
        width: 15,
      },
      {
        values: ['Telefoonnummer', '+2132, +4321 (comment)', '', ''],
        width: 25,
      },
      {
        values: ['Emailadres', 'aoeu@test.com, hello@example.com', '', ''],
        width: 25,
      },
      { values: ['Adres', 'Straat 12A, 4444 Stad', '', ''], width: 30 },
      { values: ['Actief', 'Nee', 'Ja', 'Ja'] },
      { values: ['Rekeningnummer', 'BE44 4444 4444', '', ''], width: 25 },
      { values: ['Gestart in', 2019, undefined, undefined] },
      {
        values: [
          'Attesten',
          'Attest animator, Attest hoofdanimator, Attest instructeur',
          'Attest animator',
          '',
        ],
        width: 35,
      },
      { values: ['Opmerkingen', 'Remarks here', '', ''], width: 75 },
    ]

    expect(res.worksheets[0].columns).to.eql(crewListExpected)
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

    expect(res.filename).to.equal('Aanwezigheden animatoren 2019')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Aanwezigheden animatoren 2019')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const expected = [
      { values: ['', '', 'Voornaam', 'Animator 1', 'Animator 2'], width: 20 },
      { values: ['', '', 'Familienaam', 'Achernaam', 'Achernaam'], width: 25 },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Voormiddag',
          'Omschrijving 1',
          true,
          false,
        ],
        width: 22,
      },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Namiddag',
          'Omschrijving 2',
          true,
          true,
        ],
        width: 22,
      },
      {
        values: [
          { day: 5, month: 8, year: 2019 },
          'Externe activiteit',
          'Bellewaerde met de tieners',
          false,
          false,
        ],
        width: 22,
      },
    ]

    expect(res.worksheets[0].columns).to.eql(expected)
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

    expect(res.filename).to.equal('Aanwezigheden kinderen 2019')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Aanwezigheden kinderen 2019')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const expected = [
      { values: ['', '', 'Voornaam', 'Kind 1', 'Kind 2'], width: 20 },
      { values: ['', '', 'Familienaam', 'Achter', 'Achter'], width: 25 },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Voormiddag',
          'Omschrijving 1',
          true,
          false,
        ],
        width: 22,
      },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Namiddag',
          'Omschrijving 2',
          true,
          true,
        ],
        width: 22,
      },
      {
        values: [
          { day: 5, month: 8, year: 2019 },
          'Externe activiteit',
          'Bellewaerde met de tieners',
          false,
          false,
        ],
        width: 22,
      },
    ]

    expect(res.worksheets[0].columns).to.eql(expected)
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

    expect(res.filename).to.equal('Data fiscale attesten 2019')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Data fiscale attesten 2019')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const expected = [
      { values: ['', '', '', 'Voornaam', 'Kind 1', 'Kind 2'], width: 20 },
      { values: ['', '', '', 'Familienaam', 'Achter', 'Achter'], width: 25 },
      {
        values: [
          '',
          '',
          '',
          'Totaal (incl. korting)',
          { euro: 13, cents: 20 },
          { euro: 5, cents: 0 },
        ],
        width: 25,
      },
      {
        values: [
          '',
          '',
          '',
          'Geboortedatum',
          { day: 2, month: 3, year: 2014 },
          undefined,
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
      { values: ['', '', '', 'Postcode', 4444, 7777], width: 25 },
      { values: ['', '', '', 'Stad', 'Stad', 'Stadt'], width: 25 },
      { values: ['Dag', 'Type', 'Prijs'], width: 25 },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Voormiddag',
          { euro: 5, cents: 50 },
          'Omschrijving 1',
          true,
          false,
        ],
        width: 22,
      },
      {
        values: [
          { day: 3, month: 4, year: 2019 },
          'Namiddag',
          { euro: 2, cents: 50 },
          'Omschrijving 2',
          true,
          true,
        ],
        width: 22,
      },
      {
        values: [
          { day: 5, month: 8, year: 2019 },
          'Externe activiteit',
          { euro: 20, cents: 0 },
          'Bellewaerde met de tieners',
          false,
          false,
        ],
        width: 22,
      },
    ]

    expect(res.worksheets[0].columns).to.eql(expected)
  })

  it('createChildrenPerDayList', () => {
    const res = exporter.createChildrenPerDayList(
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

    expect(res.filename).to.equal('Aantal unieke kinderen per dag 2019')
    expect(res.worksheets).to.have.length(1)
    expect(res.worksheets[0].name).to.equal('Unieke kinderen per dag 2019')
    expect(res.worksheets[0].name).to.have.length.lessThan(31) // Excel worksheet names must be <31 characters

    const expected = [
      {
        values: [
          'Dag',
          { day: 3, month: 4, year: 2019 },
          { day: 5, month: 8, year: 2019 },
        ],
        width: 20,
      },
      { values: ['Aantal unieke kinderen', 2, 0], width: 25 },
    ]

    expect(res.worksheets[0].columns).to.eql(expected)
  })
})
