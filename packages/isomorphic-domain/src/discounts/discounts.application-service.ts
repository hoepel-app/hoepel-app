import { DiscountsRepository } from './discount.repository'
import { Discounts } from './discounts'
import { Observable } from 'rxjs'
import { AddDiscountCommand } from './commands/add-discount.command'
import { CommandResult } from '@hoepel.app/ddd-library'
import { first } from 'rxjs/operators'
import { RenameDiscountCommand } from './commands/rename-discount.command'
import { RemoveDiscountCommand } from './commands/remove-discount.command'

export class DiscountsApplicationService {
  constructor(private readonly repo: DiscountsRepository) {}

  findDiscounts(tenantId: string): Observable<Discounts> {
    return this.repo.getForTenant(tenantId)
  }

  async addDiscount(command: AddDiscountCommand): Promise<CommandResult> {
    const discounts = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    if (command.discount.name.trim() === '') {
      return {
        status: 'rejected',
        reason: 'Discount name is empty',
      }
    }

    if (!discounts.mayAddDiscount(command.discount)) {
      return {
        status: 'rejected',
        reason: `May not add the discount with name ${command.discount.name}`,
      }
    }

    await this.repo.put(discounts.withDiscountAdded(command.discount))

    return { status: 'accepted' }
  }

  async renameDiscount(command: RenameDiscountCommand): Promise<CommandResult> {
    const discounts = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    if (command.newName.trim() === '') {
      return {
        status: 'rejected',
        reason: `New name is empty`,
      }
    }

    if (!discounts.discountWithNameExists(command.oldName)) {
      return {
        status: 'rejected',
        reason: `A discount with name ${command.oldName} does not exist`,
      }
    }

    if (discounts.discountWithNameExists(command.newName)) {
      return {
        status: 'rejected',
        reason: `A discount with name ${command.newName} already exists`,
      }
    }

    await this.repo.put(
      discounts.withDiscountRenamed(command.oldName, command.newName)
    )

    return { status: 'accepted' }
  }

  async removeDiscount(command: RemoveDiscountCommand): Promise<CommandResult> {
    const discounts = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!discounts.discountWithNameExists(command.discountName)) {
      return {
        status: 'rejected',
        reason: `A discount with name ${command.discountName} does not exist`,
      }
    }

    await this.repo.put(discounts.withDiscountRemoved(command.discountName))

    return { status: 'accepted' }
  }
}
