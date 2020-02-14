import { createEvent } from './create-event'

describe('createEvent', () => {
  const exampleUser = { uid: 'my-id', email: 'help' }

  it('create event with Date as timestamp', () => {
    expect(
      createEvent<'an-event', { myData: string }>(
        'an-event',
        { myData: 'example value' },
        'my-organisation',
        exampleUser,
        new Date(1581267803799)
      )
    ).toMatchInlineSnapshot(`
      Object {
        "name": "an-event",
        "organisationId": "my-organisation",
        "payload": Object {
          "myData": "example value",
        },
        "timestamp": 1581267803799,
        "triggeredBy": Object {
          "email": "help",
          "type": "user",
          "uid": "my-id",
        },
      }
    `)
  })

  it('throws an error when organisationId is null', () => {
    expect(() =>
      createEvent<'my-event', { x: string }>(
        'my-event',
        { x: 'aoeu' },
        (null as unknown) as string,
        exampleUser,
        new Date(1581267843117)
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Could not create event 'my-event' for organisation 'null' with value {\\"x\\":\\"aoeu\\"} and timestamp Sun Feb 09 2020 18:04:03 GMT+0100 (Central European Standard Time), triggered by user {\\"uid\\":\\"my-id\\",\\"email\\":\\"help\\"}"`
    )
  })
})
