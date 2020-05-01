import { Consumables, Consumable } from './consumables'
import { ConsumablesApplicationService } from './consumables.application-service'
import { CommandMetadata } from '@hoepel.app/ddd-library'
import { of } from 'rxjs'
import { first } from 'rxjs/operators'
import { AddConsumableCommand } from './commands/add-consumable.command'
import { ChangeConsumablePriceCommand } from './commands/change-consumable-price.command'
import { RemoveConsumableCommand } from './commands/remove-consumable.command'

describe('ConsumablesApplicationService', () => {
  const exampleConsumables = (tenantId: string): Consumables =>
    Consumables.createEmpty(tenantId)
      .withConsumableAdded(Consumable.create('Big Chocolate Cookie', 100))
      .withConsumableAdded(Consumable.create('Water', 0))

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

  describe('findConsumables', () => {
    it('finds consumable for a tenant', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)

      const found = await service
        .findConsumables('my-tenant-id-here')
        .pipe(first())
        .toPromise()

      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.getForTenant).toHaveBeenLastCalledWith('my-tenant-id-here')
      expect(found).toEqual(exampleConsumables('my-tenant-id-here'))
    })
  })

  describe('addConsumable', () => {
    it('rejects when adding duplicate consumable', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const newConsumable = Consumable.create('Water', 200)
      const command = AddConsumableCommand.create(
        newConsumable,
        commandMetadata
      )

      const commandResult = await service.addConsumable(command)

      expect(commandResult.status).toEqual('rejected')
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('adds a new consumable', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const newConsumable = Consumable.create('Soup', 100)
      const command = AddConsumableCommand.create(
        newConsumable,
        commandMetadata
      )

      const commandResult = await service.addConsumable(command)

      expect(commandResult.status).toEqual('accepted')
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('changeConsumablePrice', () => {
    it('rejects when consumable does not exist', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const command = ChangeConsumablePriceCommand.create(
        'Lemonade',
        100,
        commandMetadata
      )

      const commandResult = await service.changeConsumablePrice(command)

      expect(commandResult.status).toEqual('rejected')
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('changes the price for a consumable', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const command = ChangeConsumablePriceCommand.create(
        'Big Chocolate Cookie',
        50,
        commandMetadata
      )

      const commandResult = await service.changeConsumablePrice(command)

      expect(commandResult.status).toEqual('accepted')
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('removeConsumable', () => {
    it('rejects when consumable does not exist', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const command = RemoveConsumableCommand.create(
        'Lemonade',
        commandMetadata
      )

      const commandResult = await service.removeConsumable(command)

      expect(commandResult.status).toEqual('rejected')
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('removes a consumable', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleConsumables(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ConsumablesApplicationService(repo)
      const command = RemoveConsumableCommand.create(
        'Big Chocolate Cookie',
        commandMetadata
      )

      const commandResult = await service.removeConsumable(command)

      expect(commandResult.status).toEqual('accepted')
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })
})
