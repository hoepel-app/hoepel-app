import { ChangeConsumablePriceCommand } from './change-consumable-price.command'
import { CommandMetadata } from '@hoepel.app/ddd-library'

describe('ChangeConsumablePriceCommand', () => {
  it('throws when using a negative price', () => {
    const commandMetadata: CommandMetadata = {
      commandId: 'my-command-id-123',
      requestedBy: {
        email: 'test@example.org',
        type: 'user',
        uid: 'my-uid-123',
      },
      tenantId: 'some-tenant-id',
      timestamp: new Date('2020-04-25T19:43:29.161Z'),
    }

    expect(() =>
      ChangeConsumablePriceCommand.create('Cookie', -1000, commandMetadata)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot create price with negative cents"`
    )
  })

  it('throws when using a floating point price', () => {
    const commandMetadata: CommandMetadata = {
      commandId: 'my-command-id-123',
      requestedBy: {
        email: 'test@example.org',
        type: 'user',
        uid: 'my-uid-123',
      },
      tenantId: 'some-tenant-id',
      timestamp: new Date('2020-04-25T19:43:29.161Z'),
    }

    expect(() =>
      ChangeConsumablePriceCommand.create('Cookie', 66.66, commandMetadata)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Price in cents should be an integer"`
    )
  })
})
