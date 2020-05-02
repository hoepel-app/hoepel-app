import { AgeGroupsApplicationService } from './age-groups.application-service'
import { AgeGroups } from './age-groups'
import { AddAgeGroupCommand } from './commands/add-age-group.command'
import { AgeGroup } from './age-group'
import { ChangeSwitchOverOnCommand } from './commands/change-switch-over-on.command'
import { RemoveAgeGroupCommand } from './commands/remove-age-group.command'
import { of } from 'rxjs'
import { first } from 'rxjs/operators'
import { RemoveAgeFromAgeGroupCommand } from './commands/remove-age-from-age-group.command'
import { AddAgeToAgeGroupCommand } from './commands/add-age-to-age-group.command'
import { ChangeAgeGroupNameCommand } from './commands/change-age-group-name.command'
import { CommandMetadata } from '@hoepel.app/ddd-library'
import '@hoepel.app/ddd-library-test-utils'

describe('AgeGroupsApplicationService', () => {
  const exampleGroups = (tenantId: string): AgeGroups =>
    AgeGroups.create(tenantId, 'new-school-year')
      .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
      .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
      .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
      .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

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

  describe('addAgeGroup', () => {
    it('rejects if age group with name already exists', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = AddAgeGroupCommand.create(
        AgeGroup.create('Tieners', new Set([12])),
        commandMetadata
      )

      const commandResult = await service.addAgeGroup(command)

      expect(commandResult).toBeRejected()
      expect(repo.put).not.toHaveBeenCalled()
    })

    it('accepts if age group can be added', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const command = AddAgeGroupCommand.create(
        AgeGroup.create('Oudere tieners', new Set([14])),
        commandMetadata
      )

      const commandResult = await service.addAgeGroup(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('changeSwitchOverOn', () => {
    it('changes switchover of age groups', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = ChangeSwitchOverOnCommand.create(
        'childs-birthday',
        commandMetadata
      )

      const commandResult = await service.changeSwitchOverOn(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('removeAgeGroup', () => {
    it('removes an age group by name', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const command = RemoveAgeGroupCommand.create('Tieners', commandMetadata)

      const commandResult = await service.removeAgeGroup(command)

      expect(commandResult).toBeAccepted()
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('findAgeGroups', () => {
    it('find age groups for a tenant', async () => {
      const groups = exampleGroups('my-tenant')

      const repo = {
        getForTenant: jest.fn(() => of(groups)),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const result = await service
        .findAgeGroups('my-tenant-name')
        .pipe(first())
        .toPromise()

      expect(result).toEqual(groups)
      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.getForTenant.mock.calls[0]).toEqual(['my-tenant-name'])
    })
  })

  describe('removeAgeFromAgeGroup', () => {
    it('removes age from age group and persists', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const group = await service.removeAgeFromAgeGroup(
        RemoveAgeFromAgeGroupCommand.create('Tieners', 12, commandMetadata)
      )

      expect(group).toBeAccepted()
      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('addAgeToAgeGroup', () => {
    it('adds age to age group and persists', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const group = await service.addAgeToAgeGroup(
        AddAgeToAgeGroupCommand.create('Tieners', 14, commandMetadata)
      )

      expect(group).toBeAccepted()
      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('changeAgeGroupName', () => {
    it('changes the name of an age group and persists', async () => {
      const repo = {
        getForTenant: jest.fn((tenantId: string) =>
          of(exampleGroups(tenantId))
        ),
        put: jest.fn(() => Promise.resolve()),
      }

      const service = new AgeGroupsApplicationService(repo)

      const group = await service.changeAgeGroupName(
        ChangeAgeGroupNameCommand.create(
          'Tieners',
          'Nieuwe Naam',
          commandMetadata
        )
      )

      expect(group).toBeAccepted()
      expect(repo.getForTenant).toHaveBeenCalledTimes(1)
      expect(repo.put).toHaveBeenCalledTimes(1)
      expect(repo.put.mock.calls[0]).toMatchSnapshot()
    })
  })
})
