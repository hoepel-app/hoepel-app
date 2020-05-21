import { CommandBase, CommandMetadata } from '@hoepel.app/ddd-library'
import { ShiftPreset, ShiftPresetProps } from '../shift-preset'

type Payload = {
  presetProps: ShiftPresetProps
}

export class AddShiftPresetCommand extends CommandBase<Payload> {
  name = 'add-shift-preset-command' as const

  static create(
    preset: ShiftPreset,
    commandMetadata: CommandMetadata
  ): AddShiftPresetCommand {
    return new AddShiftPresetCommand(
      {
        presetProps: preset.toProps(),
      },
      commandMetadata
    )
  }

  get preset(): ShiftPreset {
    return ShiftPreset.fromProps(this.payload.presetProps)
  }
}
