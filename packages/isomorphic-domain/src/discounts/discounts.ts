import { Aggregate } from '@hoepel.app/ddd-library'
import { DiscountProps, Discount } from './discount'

export type DiscountsProps = {
  readonly tenantId: string
  readonly discounts: DiscountProps[]
}

export class Discounts implements Aggregate {
  private constructor(private readonly props: DiscountsProps) {}

  static createEmpty(tenantId: string): Discounts {
    return new Discounts({ tenantId, discounts: [] })
  }

  get id(): string {
    return `${this.tenantId}-discounts`
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get names(): ReadonlySet<string> {
    return new Set(this.discounts.map((discount) => discount.name))
  }

  get namesSorted(): readonly string[] {
    return [...this.names].sort()
  }

  get discounts(): readonly Discount[] {
    return [
      ...this.props.discounts.map((props) => Discount.fromProps(props)),
    ].sort((a, b) => a.name.localeCompare(b.name))
  }

  toProps(): DiscountsProps {
    return this.props
  }

  static fromProps(props: DiscountsProps): Discounts {
    return new Discounts(props)
  }

  get isEmpty(): boolean {
    return this.props.discounts.length === 0
  }

  mayAddDiscount(discount: Discount): boolean {
    return !this.discountWithNameExists(discount.name)
  }

  discountWithNameExists(name: string): boolean {
    return this.names.has(name)
  }

  findDiscountWithName(name: string): Discount | null {
    return this.discounts.find((discount) => discount.name === name) ?? null
  }

  withDiscountAdded(discount: Discount): Discounts {
    if (!this.mayAddDiscount(discount)) {
      return this
    }

    return Discounts.fromProps({
      ...this.toProps(),
      discounts: [
        ...this.discounts.map((d) => d.toProps()),
        discount.toProps(),
      ],
    })
  }

  withDiscountRenamed(oldName: string, newName: string): Discounts {
    const oldDiscount = this.findDiscountWithName(oldName)

    if (oldDiscount == null || this.discountWithNameExists(newName)) {
      return this
    }

    const renamedDiscount = oldDiscount.withName(newName)

    return Discounts.fromProps({
      ...this.toProps(),
      discounts: [
        ...this.discounts
          .filter((d) => d.name !== oldName)
          .map((d) => d.toProps()),
        renamedDiscount.toProps(),
      ],
    })
  }

  withDiscountRemoved(name: string): Discounts {
    return Discounts.fromProps({
      ...this.toProps(),
      discounts: [
        ...this.discounts
          .filter((d) => d.name !== name)
          .map((d) => d.toProps()),
      ],
    })
  }
}
