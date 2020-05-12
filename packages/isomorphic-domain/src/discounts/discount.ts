import { Price } from '@hoepel.app/types'

type AbsoluteDiscountValue = {
  kind: 'relative-discount'
  discountPercent: number
}
type RelativeDiscountValue = {
  kind: 'absolute-discount'
  discountCents: number
}
type DiscountValue = AbsoluteDiscountValue | RelativeDiscountValue

export type DiscountProps = {
  name: string
  discount: DiscountValue
}

export class Discount {
  private constructor(private readonly props: DiscountProps) {}

  toProps(): DiscountProps {
    return this.props
  }

  static fromProps(props: DiscountProps): Discount {
    return new Discount(props)
  }

  static createRelativeDiscount(name: string, percent: number): Discount {
    const discountPercent = Math.round(Math.min(100, Math.max(percent, 0)))

    return new Discount({
      name,
      discount: {
        kind: 'relative-discount',
        discountPercent: isNaN(discountPercent) ? 0 : discountPercent,
      },
    })
  }

  static createAbsoluteDiscount(name: string, price: Price): Discount {
    return new Discount({
      name,
      discount: {
        kind: 'absolute-discount',
        discountCents: price.totalCents,
      },
    })
  }

  /**
   * Apply a list of discounts to a price. The discounts will be applied in the array order.
   *
   * The result will never be negative (always at least 0.00EUR)
   *
   * @param to The price to apply these discounts to
   * @param discounts The list of discounts to be applied
   */
  static applyAllDiscounts(to: Price, discounts: readonly Discount[]): Price {
    return discounts.reduce((acc, current) => {
      return current.applyTo(acc)
    }, to)
  }

  /**
   * Applies this discount to a price.
   * The result will never be negative (always at least 0.00EUR)
   */
  applyTo(price: Price): Price {
    switch (this.props.discount.kind) {
      case 'absolute-discount': {
        return price.subtract(this.absoluteDiscount)
      }
      case 'relative-discount': {
        const pct = this.discountPercentage * 0.01
        return price.multiply(1 - pct)
      }
    }
  }

  get isRelativeDiscount(): boolean {
    return this.props.discount.kind === 'relative-discount'
  }

  get isAbsoluteDiscount(): boolean {
    return this.props.discount.kind === 'absolute-discount'
  }

  /**
   * Return the discount as a percentage ([0,100]).
   * If this discount is an absolute discount, returns 0%
   */
  get discountPercentage(): number {
    switch (this.props.discount.kind) {
      case 'absolute-discount':
        return 0
      case 'relative-discount':
        return this.props.discount.discountPercent
    }
  }

  /**
   * Return the absolute discount as a price to be substracted
   * If this discount is a relative discount, returns 0.00EUR
   */
  get absoluteDiscount(): Price {
    switch (this.props.discount.kind) {
      case 'absolute-discount':
        return Price.fromCents(this.props.discount.discountCents)
      case 'relative-discount':
        return Price.zero
    }
  }

  get name(): string {
    return this.props.name
  }

  withName(name: string): Discount {
    return Discount.fromProps({
      ...this.toProps(),
      name,
    })
  }
}
