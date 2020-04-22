import { Command } from '../command/command'
import { SwitchOverOn } from './age-group'

export type ChangeSwitchOverOnCommandProps = {
  tenantId: string
  switchOverOn: SwitchOverOn
}

export class ChangeSwitchOverOnCommand
  implements Command<ChangeSwitchOverOnCommandProps> {
  name = 'change-switchover-on-agegroup-command' as const

  private constructor(private readonly props: ChangeSwitchOverOnCommandProps) {}

  static create(
    tenantId: string,
    switchOverOn: SwitchOverOn
  ): ChangeSwitchOverOnCommand {
    return new ChangeSwitchOverOnCommand({
      tenantId,
      switchOverOn,
    })
  }

  toProps(): ChangeSwitchOverOnCommandProps {
    return this.props
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get switchOverOn(): SwitchOverOn {
    return this.props.switchOverOn
  }
}
