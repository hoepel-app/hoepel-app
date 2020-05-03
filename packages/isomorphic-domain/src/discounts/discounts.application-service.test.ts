import { CommandMetadata } from '@hoepel.app/ddd-library'
import { Discounts } from './discounts'
import { Price } from '@hoepel.app/types'
import { Discount } from './discount'
import { DiscountsApplicationService } from './discounts.application-service'
import { AddDiscountCommand } from './commands/add-discount.command'
import { of } from 'rxjs'

import '@hoepel.app/ddd-library-test-utils'
import { RenameDiscountCommand } from './commands/rename-discount.command'
import { RemoveDiscountCommand } from './commands/remove-discount.command'

describe('DiscountsApplicationService', () => {
  const exampleDiscounts = (tenantId: string): Discounts =>
    Discounts.createEmpty(tenantId)
      .withDiscountAdded(
        Discount.createAbsoluteDiscount('1 euro korting', Price.fromCents(100))
      )
      .withDiscountAdded(Discount.createRelativeDiscount('Kansentarief', 60))
      .withDiscountAdded(Discount.createRelativeDiscount('Tweede kind', 50))

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

  describe('addDiscount', () => {
    it('rejects when adding a discount with a name that is already taken', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = AddDiscountCommand.create(
        Discount.createAbsoluteDiscount('Kansentarief', Price.fromCents(100)),
        commandMetadata
      )

      const result = await service.addDiscount(command)

      expect(result).toBeRejectedWithReason(
        'May not add the discount with name Kansentarief'
      )
      expect(repo.put).not.toBeCalled()
    })

    it('rejects when adding a discount with an empty name', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = AddDiscountCommand.create(
        Discount.createAbsoluteDiscount('', Price.fromCents(100)),
        commandMetadata
      )

      const result = await service.addDiscount(command)

      expect(result).toBeRejectedWithReason('Discount name is empty')
      expect(repo.put).not.toBeCalled()
    })

    it('can add a discount', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = AddDiscountCommand.create(
        Discount.createAbsoluteDiscount('Test', Price.fromCents(100)),
        commandMetadata
      )

      const result = await service.addDiscount(command)

      expect(result).toBeAccepted()
      expect(repo.put).toBeCalledTimes(1)
      expect(repo.put.mock.calls).toMatchSnapshot()
    })
  })

  describe('renameDiscount', () => {
    it('rejects empty new name', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RenameDiscountCommand.create(
        'Tweede kind',
        '',
        commandMetadata
      )

      const result = await service.renameDiscount(command)

      expect(result).toBeRejectedWithReason('New name is empty')
      expect(repo.put).not.toBeCalled()
    })

    it('rejects renaming a discount that does not exist', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RenameDiscountCommand.create(
        'Derde kind',
        'Naam',
        commandMetadata
      )

      const result = await service.renameDiscount(command)

      expect(result).toBeRejectedWithReason(
        'A discount with name Derde kind does not exist'
      )
      expect(repo.put).not.toBeCalled()
    })

    it('rejects renaming when the new name already exists', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RenameDiscountCommand.create(
        'Tweede kind',
        'Kansentarief',
        commandMetadata
      )

      const result = await service.renameDiscount(command)

      expect(result).toBeRejectedWithReason(
        'A discount with name Kansentarief already exists'
      )
      expect(repo.put).not.toBeCalled()
    })

    it('renames a discount', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RenameDiscountCommand.create(
        'Tweede kind',
        'Nieuwe naam',
        commandMetadata
      )

      const result = await service.renameDiscount(command)

      expect(result).toBeAccepted()
      expect(repo.put).toBeCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('removeDiscount', () => {
    it('rejects when name not found', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RemoveDiscountCommand.create('Something', commandMetadata)

      const result = await service.removeDiscount(command)

      expect(result).toBeRejectedWithReason(
        'A discount with name Something does not exist'
      )
      expect(repo.put).not.toBeCalled()
    })

    it('removes a discount', async () => {
      const repo = {
        put: jest.fn(),
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleDiscounts(tenantId))
        ),
      }

      const service = new DiscountsApplicationService(repo)
      const command = RemoveDiscountCommand.create(
        'Tweede kind',
        commandMetadata
      )

      const result = await service.removeDiscount(command)

      expect(result).toBeAccepted()
      expect(repo.put).toBeCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })
})
