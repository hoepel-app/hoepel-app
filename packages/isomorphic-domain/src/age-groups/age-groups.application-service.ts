import { AgeGroupsRepository } from './age-groups.repository'
import { CommandResult } from '../command/command'
import { AddAgeGroupCommand } from './add-age-group.command'
import { ChangeSwitchOverOnCommand } from './change-switch-over-on.command'
import { RemoveAgeGroupCommand } from './remove-age-group.command'
import { AddAgeToAgeGroupCommand } from './add-age-to-age-group.command'
import { AgeGroups } from './age-groups'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { RemoveAgeFromAgeGroupCommand } from './remove-age-from-age-group.command'
import { ChangeAgeGroupNameCommand } from './change-age-group-name.command'

export class AgeGroupsApplicationService {
  constructor(private repo: AgeGroupsRepository) {}

  findAgeGroups(tenantId: string): Observable<AgeGroups> {
    return this.repo.findForTenant(tenantId)
  }

  async addAgeGroup(command: AddAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!ageGroups.mayAddAgeGroup(command.ageGroup)) {
      return { status: 'rejected' }
    }

    const newAgeGroups = ageGroups.withAddedAgeGroup(command.ageGroup)
    await this.repo.putForTenant(command.tenantId, newAgeGroups)

    return { status: 'accepted' }
  }

  async changeSwitchOverOn(
    command: ChangeSwitchOverOnCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withSwitchOverOn(command.switchOverOn)
    )

    return { status: 'accepted' }
  }

  async removeAgeGroup(command: RemoveAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withAgeGroupRemoved(command.ageGroupName)
    )

    return { status: 'accepted' }
  }

  async removeAgeFromAgeGroup(
    command: RemoveAgeFromAgeGroupCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withAgeRemovedFromAgeGroup(command.ageGroupName, command.age)
    )

    return { status: 'accepted' }
  }

  async addAgeToAgeGroup(
    command: AddAgeToAgeGroupCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withAgeAddedToAgeGroup(command.ageGroupName, command.age)
    )

    return { status: 'accepted' }
  }

  async changeAgeGroupName(
    command: ChangeAgeGroupNameCommand
  ): Promise<CommandResult> {
    const ageGroups = await this.repo
      .findForTenant(command.tenantId)
      .pipe(first())
      .toPromise()

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withAgeGroupRenamed(
        command.ageGroupCurrentName,
        command.ageGroupNewName
      )
    )

    return { status: 'accepted' }
  }
}
