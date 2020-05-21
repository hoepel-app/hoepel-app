import { CommandMetadata } from '@hoepel.app/ddd-library'
import { of } from 'rxjs'
import { first } from 'rxjs/operators'
import { ShiftPresets } from './shift-presets'
import { ShiftPreset } from './shift-preset'
import { Price } from '@hoepel.app/types'
import { ShiftPresetsApplicationService } from './shift-presets.application-service'
import { AddShiftPresetCommand } from './commands/add-shift-preset.command'
import { RemoveShiftPresetCommand } from './commands/remove-shift-preset.command'
import { RenameShiftPresetCommand } from './commands/rename-shift-preset.command'

import '@hoepel.app/ddd-library-test-utils'

describe('ShiftsPresetsApplicationService', () => {
  const examplePresets = (tenantId: string): ShiftPresets =>
    ShiftPresets.createEmpty(tenantId)
      .withPresetAdded(ShiftPreset.createEmpty('Afternoon'))
      .withPresetAdded(
        ShiftPreset.createEmpty('External activity').withPrice(
          Price.fromCents(3000)
        )
      )
      .withPresetAdded(
        ShiftPreset.createEmpty('Crew activity').withChildrenCanBePresent(false)
      )

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

  describe('findShiftPresets', () => {
    it('finds shift presets for a tenant', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)

      const found = await service
        .findShiftPresets('my-tenant-id-here')
        .pipe(first())
        .toPromise()

      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.getForTenant).toHaveBeenLastCalledWith('my-tenant-id-here')
      expect(found).toEqual(examplePresets('my-tenant-id-here'))
    })
  })

  describe('addShiftPreset', () => {
    it('rejects when adding duplicate shift preset', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const newPreset = ShiftPreset.createEmpty('External activity')
      const command = AddShiftPresetCommand.create(newPreset, commandMetadata)

      const commandResult = await service.addShiftPreset(command)

      expect(commandResult).toBeRejected()
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('adds a new shift preset', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const newPreset = ShiftPreset.createEmpty('Noon')
      const command = AddShiftPresetCommand.create(newPreset, commandMetadata)

      const commandResult = await service.addShiftPreset(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('removeShiftPreset', () => {
    it('rejects when removing shift preset with unknown name', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const command = RemoveShiftPresetCommand.create(
        "I don't exist",
        commandMetadata
      )

      const commandResult = await service.removeShiftPreset(command)

      expect(commandResult).toBeRejectedWithReason(
        `A shift preset with the name I don't exist does not exist`
      )
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('removes a shift preset', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const command = RemoveShiftPresetCommand.create(
        'Crew activity',
        commandMetadata
      )

      const commandResult = await service.removeShiftPreset(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('renameShiftPreset', () => {
    it('rejects when renaming shift preset with unknown name', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const command = RenameShiftPresetCommand.create(
        "I don't exist",
        'New Name',
        commandMetadata
      )

      const commandResult = await service.renameShiftPreset(command)

      expect(commandResult).toBeRejectedWithReason(
        `A shift preset with the name 'I don't exist' does not exist`
      )
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('rejects when renaming shift preset to an existing name', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const command = RenameShiftPresetCommand.create(
        'Crew activity',
        'External activity',
        commandMetadata
      )

      const commandResult = await service.renameShiftPreset(command)

      expect(commandResult).toBeRejectedWithReason(
        `A shift preset with the name 'External activity' does already exist`
      )
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('renames a shift preset', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(examplePresets(tenantId))
        ),
        put: jest.fn(),
      }

      const service = new ShiftPresetsApplicationService(repo)
      const command = RenameShiftPresetCommand.create(
        'Crew activity',
        'My new name for Crew Activity',
        commandMetadata
      )

      const commandResult = await service.renameShiftPreset(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })
})
