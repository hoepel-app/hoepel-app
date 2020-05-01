import { AgeGroupsRepository } from './age-groups.repository'
import { CommandResult } from '@hoepel.app/ddd-library'
import { AddAgeGroupCommand } from './commands/add-age-group.command'
import { ChangeSwitchOverOnCommand } from './commands/change-switch-over-on.command'
import { RemoveAgeGroupCommand } from './commands/remove-age-group.command'
import { AddAgeToAgeGroupCommand } from './commands/add-age-to-age-group.command'
import { AgeGroups } from './age-groups'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { RemoveAgeFromAgeGroupCommand } from './commands/remove-age-from-age-group.command'
import { ChangeAgeGroupNameCommand } from './commands/change-age-group-name.command'

export class AgeGroupsApplicationService {
  constructor(private readonly repo: AgeGroupsRepository) {}

  findAgeGroups(tenantId: string): Observable<AgeGroups> {
    return this.repo.getForTenant(tenantId)
  }

  async addAgeGroup(command: AddAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!ageGroups.mayAddAgeGroup(command.ageGroup)) {
      return { status: 'rejected' }
    }

    const newAgeGroups = ageGroups.withAddedAgeGroup(command.ageGroup)

    await this.repo.put(newAgeGroups)

    return { status: 'accepted' }
  }

  async changeSwitchOverOn(
    command: ChangeSwitchOverOnCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.put(ageGroups.withSwitchOverOn(command.switchOverOn))

    return { status: 'accepted' }
  }

  async removeAgeGroup(command: RemoveAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.put(ageGroups.withAgeGroupRemoved(command.ageGroupName))

    return { status: 'accepted' }
  }

  async removeAgeFromAgeGroup(
    command: RemoveAgeFromAgeGroupCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.put(
      ageGroups.withAgeRemovedFromAgeGroup(command.ageGroupName, command.age)
    )

    return { status: 'accepted' }
  }

  async addAgeToAgeGroup(
    command: AddAgeToAgeGroupCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.put(
      ageGroups.withAgeAddedToAgeGroup(command.ageGroupName, command.age)
    )

    return { status: 'accepted' }
  }

  async changeAgeGroupName(
    command: ChangeAgeGroupNameCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .getForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.put(
      ageGroups.withAgeGroupRenamed(
        command.ageGroupCurrentName,
        command.ageGroupNewName
      )
    )

    return { status: 'accepted' }
  }
}
