import { Price } from '@hoepel.app/types'
import { Aggregate } from '@hoepel.app/ddd-library/src'

export type ConsumableProps = {
  readonly name: string
  readonly priceCents: number
}

export type ConsumablesProps = {
  readonly consumables: readonly ConsumableProps[]
  readonly tenantId: string
}

export class Consumables implements Aggregate {
  private constructor(private readonly props: ConsumablesProps) {}

  static createEmpty(tenantId: string): Consumables {
    return new Consumables({ tenantId, consumables: [] })
  }

  static fromProps(props: ConsumablesProps): Consumables {
    return new Consumables(props)
  }

  toProps(): ConsumablesProps {
    return this.props
  }

  get id(): string {
    return `${this.tenantId}-consumables`
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get names(): ReadonlySet<string> {
    return new Set(this.consumables.map((consumable) => consumable.name))
  }

  get consumables(): readonly Consumable[] {
    return this.props.consumables.map((props) => Consumable.fromProps(props))
  }

  withConsumableAdded(consumable: Consumable): Consumables {
    if (!this.mayAddConsumable(consumable)) {
      return this
    }

    return Consumables.fromProps({
      ...this.toProps(),
      consumables: [...this.toProps().consumables, consumable.toProps()],
    })
  }

  withConsumableRemoved(name: string): Consumables {
    return Consumables.fromProps({
      ...this.toProps(),
      consumables: this.toProps().consumables.filter((c) => c.name !== name),
    })
  }

  withChangedPriceForConsumable(
    name: string,
    newPriceCents: number
  ): Consumables {
    if (!this.consumableWithNameExists(name)) {
      return this
    }

    return Consumables.fromProps({
      ...this.toProps(),
      consumables: [
        ...this.toProps().consumables.filter((c) => c.name !== name),
        Consumable.create(name, newPriceCents).toProps(),
      ],
    })
  }

  withRenamedConsumable(oldName: string, newName: string): Consumables {
    const currentConsumable = this.findConsumableByName(oldName)

    if (this.consumableWithNameExists(newName) || currentConsumable == null) {
      return this
    }

    return Consumables.fromProps({
      ...this.toProps(),
      consumables: [
        ...this.toProps().consumables.filter((c) => c.name !== oldName),
        currentConsumable.withName(newName).toProps(),
      ],
    })
  }

  findConsumableByName(name: string): Consumable | null {
    return (
      this.consumables.find((consumable) => consumable.name === name) ?? null
    )
  }

  mayAddConsumable(consumable: Consumable): boolean {
    return !this.consumableWithNameExists(consumable.name)
  }

  consumableWithNameExists(name: string): boolean {
    return this.findConsumableByName(name) != null
  }
}

/**
 * Used to represent something that can be consumed or purchased, which is not an attendance.
 * E.g. drink, cookies, ...
 * Consumption of consumables is tied to a dayid/DayDate o(a specific date)
 * The same consumable can be consumed multiple times by the same child on the same day.
 */
export class Consumable {
  private constructor(private readonly props: ConsumableProps) {}

  static create(name: string, priceCents: number): Consumable {
    if (priceCents < 0) {
      throw new Error('Price in cents must be a positive number')
    }

    if (Math.round(priceCents) != priceCents) {
      throw new Error('Price in cents must be an integer')
    }

    return new Consumable({ name, priceCents })
  }

  static fromProps(props: ConsumableProps): Consumable {
    return new Consumable(props)
  }

  withName(newName: string): Consumable {
    return Consumable.fromProps({
      ...this.toProps(),
      name: newName,
    })
  }

  toProps(): ConsumableProps {
    return this.props
  }

  /**
   * Price of the consumable. May not be included in fiscal certificates (these costs are non-refundable)!
   */
  get price(): Price {
    return Price.fromCents(this.props.priceCents)
  }

  /**
   * Name of the consumable, e.g. "Big chocolate cookie"
   */
  get name(): string {
    return this.props.name
  }
}
