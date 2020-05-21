import { Aggregate } from '@hoepel.app/ddd-library'
import { ShiftPresetProps, ShiftPreset } from './shift-preset'

export type ShiftPresetsProps = {
  readonly shiftPresets: readonly ShiftPresetProps[]
  readonly tenantId: string
}

export class ShiftPresets implements Aggregate {
  private constructor(private readonly props: ShiftPresetsProps) {}

  get id(): string {
    return `${this.tenantId}-shift-presets`
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get presets(): readonly ShiftPreset[] {
    return this.props.shiftPresets
      .map((props) => ShiftPreset.fromProps(props))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  get names(): ReadonlySet<string> {
    return new Set(this.presets.map((group) => group.name))
  }

  get namesSorted(): readonly string[] {
    return [...this.names].sort()
  }

  get numPresets(): number {
    return this.props.shiftPresets.length
  }

  findPresetWithName(name: string): ShiftPreset | null {
    return this.presets.find((preset) => preset.name === name) || null
  }

  hasPresetWithName(name: string): boolean {
    return this.findPresetWithName(name) !== null
  }

  mayAddPreset(preset: ShiftPreset): boolean {
    return !this.hasPresetWithName(preset.name)
  }

  toProps(): ShiftPresetsProps {
    return this.props
  }

  static fromProps(props: ShiftPresetsProps): ShiftPresets {
    return new ShiftPresets(props)
  }

  static createEmpty(tenantId: string): ShiftPresets {
    return new ShiftPresets({
      tenantId,
      shiftPresets: [],
    })
  }

  withPresetAdded(preset: ShiftPreset): ShiftPresets {
    return ShiftPresets.fromProps({
      ...this.toProps(),
      shiftPresets: [
        ...this.presets
          .filter((p) => p.name !== preset.name)
          .map((p) => p.toProps()),
        preset.toProps(),
      ],
    })
  }

  withPresetRemoved(presetName: string): ShiftPresets {
    if (!this.hasPresetWithName(presetName)) {
      return this
    }

    return ShiftPresets.fromProps({
      ...this.toProps(),
      shiftPresets: [
        ...this.presets
          .filter((preset) => preset.name !== presetName)
          .map((preset) => preset.toProps()),
      ],
    })
  }

  withPresetRenamed(oldName: string, newName: string): ShiftPresets {
    const newPreset = this.findPresetWithName(oldName)?.withName(newName)

    if (newPreset == null || this.hasPresetWithName(newName)) {
      return this
    }

    return ShiftPresets.fromProps({
      ...this.toProps(),
      shiftPresets: [
        ...this.presets
          .filter((preset) => preset.name !== oldName)
          .map((preset) => preset.toProps()),
        newPreset.toProps(),
      ],
    })
  }
}
