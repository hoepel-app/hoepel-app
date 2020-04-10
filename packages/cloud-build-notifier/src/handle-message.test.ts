import { handleMessage } from './handle-message'

describe('Cloud Build Notifier', () => {
  test('notifies Slack when a build completes', async () => {
    const send = jest.fn(x => 42 + x)

    const json = JSON.stringify({
      status: 'SUCCESS',
      id: 'some-build-id',
      logUrl: 'https://example.org',
      finishTime: 1584985947077,
      startTime: 1584985945086,
    })

    await handleMessage(
      { data: Buffer.from(json).toString('base64') } as any,
      { send } as any
    )

    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "attachments": Array [
            Object {
              "fields": Array [
                Object {
                  "title": "Status",
                  "value": "SUCCESS",
                },
              ],
              "title": "Build logs",
              "title_link": "https://example.org",
            },
          ],
          "mrkdwn": true,
          "text": "Build \`some-build-id\` (success)",
        }
    `)
  })
})
