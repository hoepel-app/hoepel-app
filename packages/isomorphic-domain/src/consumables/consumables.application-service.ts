import { ConsumablesRepository } from './consumables.repository'
import { Observable } from 'rxjs'
import { Consumables } from './consumables'
import { AddConsumableCommand } from './commands/add-consumable.command'
import { first } from 'rxjs/operators'
import { CommandResult } from '@hoepel.app/ddd-library/src'
import { ChangeConsumablePriceCommand } from './commands/change-consumable-price.command'
import { RemoveConsumableCommand } from './commands/remove-consumable.command'

export class ConsumablesApplicationService {
  constructor(private readonly repo: ConsumablesRepository) {}

  findConsumables(tenantId: string): Observable<Consumables> {
    return this.repo.getForTenant(tenantId)
  }

  async addConsumable(command: AddConsumableCommand): Promise<CommandResult> {
    const consumables = await this.findConsumables(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!consumables.mayAddConsumable(command.consumable)) {
      return { status: 'rejected' }
    }

    await this.repo.put(consumables.withConsumableAdded(command.consumable))

    return { status: 'accepted' }
  }

  async changeConsumablePrice(
    command: ChangeConsumablePriceCommand
  ): Promise<CommandResult> {
    const consumables = await this.findConsumables(command.tenantId)
      .pipe(first())
      .toPromise()

    if (
      command.price.totalCents < 0 ||
      !consumables.consumableWithNameExists(command.consumableName)
    ) {
      return { status: 'rejected' }
    }

    await this.repo.put(
      consumables.withChangedPriceForConsumable(
        command.consumableName,
        command.price.totalCents
      )
    )

    return { status: 'accepted' }
  }

  async removeConsumable(
    command: RemoveConsumableCommand
  ): Promise<CommandResult> {
    const consumables = await this.findConsumables(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!consumables.consumableWithNameExists(command.consumableName)) {
      return { status: 'rejected' }
    }

    await this.repo.put(
      consumables.withConsumableRemoved(command.consumableName)
    )

    return { status: 'accepted' }
  }
}
