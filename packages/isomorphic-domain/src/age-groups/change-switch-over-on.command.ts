import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { SwitchOverOn } from './age-group'

type Payload = {
  switchOverOn: SwitchOverOn
}

export class ChangeSwitchOverOnCommand extends CommandBase<Payload> {
  name = 'change-switchover-on-agegroup-command' as const

  static create(
    switchOverOn: SwitchOverOn,
    commandMetadata: CommandMetadata
  ): ChangeSwitchOverOnCommand {
    return new ChangeSwitchOverOnCommand(
      {
        switchOverOn,
      },
      commandMetadata
    )
  }

  get switchOverOn(): SwitchOverOn {
    return this.payload.switchOverOn
  }
}
