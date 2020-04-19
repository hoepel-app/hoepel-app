import { AgeGroupsRepository } from './age-groups.repository'
import { CommandResult } from '../command/command'
import { AddAgeGroupCommand } from './add-age-group.command'
import { ChangeSwitchOverOnCommand } from './change-switch-over-on.command'
import { RemoveAgeGroupCommand } from './remove-age-group.command'
import { AgeGroups } from './age-groups'

export class AgeGroupsApplicationService {
  constructor(private repo: AgeGroupsRepository) {}

  async findAgeGroups(tenantId: string): Promise<AgeGroups> {
    return this.repo.findForTenant(tenantId)
  }

  async addAgeGroup(command: AddAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo.findForTenant(command.tenantId)
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
    const ageGroups = await this.repo.findForTenant(command.tenantId)
    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withSwitchOverOn(command.switchOverOn)
    )

    return { status: 'accepted' }
  }

  async removeAgeGroup(command: RemoveAgeGroupCommand): Promise<CommandResult> {
    const ageGroups = await this.repo.findForTenant(command.tenantId)

    await this.repo.putForTenant(
      command.tenantId,
      ageGroups.withAgeGroupRemoved(command.ageGroupName)
    )

    return { status: 'accepted' }
  }
}
