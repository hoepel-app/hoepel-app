import { ShiftPresetsRepository } from './shift-presets.repository'
import { ShiftPresets } from './shift-presets'
import { Observable } from 'rxjs'
import { CommandResult } from '@hoepel.app/ddd-library/src'
import { AddShiftPresetCommand } from './commands/add-shift-preset.command'
import { first } from 'rxjs/operators'
import { RemoveShiftPresetCommand } from './commands/remove-shift-preset.command'
import { RenameShiftPresetCommand } from './commands/rename-shift-preset.command'
import { ChangeShiftPresetPriceCommand } from './commands/change-shift-preset-price.command'

export class ShiftPresetsApplicationService {
  constructor(private readonly repo: ShiftPresetsRepository) {}

  findShiftPresets(tenantId: string): Observable<ShiftPresets> {
    return this.repo.getForTenant(tenantId)
  }

  async addShiftPreset(command: AddShiftPresetCommand): Promise<CommandResult> {
    const presets = await this.findShiftPresets(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!presets.mayAddPreset(command.preset)) {
      return { status: 'rejected' }
    }

    await this.repo.put(presets.withPresetAdded(command.preset))

    return { status: 'accepted' }
  }

  async removeShiftPreset(
    command: RemoveShiftPresetCommand
  ): Promise<CommandResult> {
    const presets = await this.findShiftPresets(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!presets.hasPresetWithName(command.presetName)) {
      return {
        status: 'rejected',
        reason: `A shift preset with the name ${command.presetName} does not exist`,
      }
    }

    await this.repo.put(presets.withPresetRemoved(command.presetName))

    return { status: 'accepted' }
  }

  async renameShiftPreset(
    command: RenameShiftPresetCommand
  ): Promise<CommandResult> {
    const presets = await this.findShiftPresets(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!presets.hasPresetWithName(command.oldName)) {
      return {
        status: 'rejected',
        reason: `A shift preset with the name '${command.oldName}' does not exist`,
      }
    }

    if (presets.hasPresetWithName(command.newName)) {
      return {
        status: 'rejected',
        reason: `A shift preset with the name '${command.newName}' does already exist`,
      }
    }

    await this.repo.put(
      presets.withPresetRenamed(command.oldName, command.newName)
    )

    return { status: 'accepted' }
  }

  async changeShiftPresetPrice(
    command: ChangeShiftPresetPriceCommand
  ): Promise<CommandResult> {
    const presets = await this.findShiftPresets(command.tenantId)
      .pipe(first())
      .toPromise()

    if (!presets.hasPresetWithName(command.presetName)) {
      return {
        status: 'rejected',
        reason: `A shift preset with the name '${command.presetName}' does not exist`,
      }
    }

    await this.repo.put(
      presets.withPresetPriceChanged(command.presetName, command.newPrice)
    )

    return { status: 'accepted' }
  }
}
