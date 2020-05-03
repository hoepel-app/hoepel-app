import { Discounts } from './discounts'
import { Discount } from './discount'
import { Price } from '@hoepel.app/types'

describe('Discounts', () => {
  const exampleDiscounts = Discounts.createEmpty('my-tenant-id')
    .withDiscountAdded(
      Discount.createAbsoluteDiscount('1 euro korting', Price.fromCents(100))
    )
    .withDiscountAdded(Discount.createRelativeDiscount('Kansentarief', 60))
    .withDiscountAdded(Discount.createRelativeDiscount('Tweede kind', 50))

  const emptyDiscounts = Discounts.createEmpty('my-tenant-id-here')

  test('serializing then deserializing yields same object', () => {
    const deserialized = Discounts.fromProps(
      JSON.parse(JSON.stringify(exampleDiscounts.toProps()))
    )

    expect(deserialized).toEqual(exampleDiscounts)
  })

  test('id', () => {
    expect(exampleDiscounts.id).toEqual('my-tenant-id-discounts')
  })

  describe('names', () => {
    it('returns names for discounts', () => {
      expect(exampleDiscounts.names).toEqual(
        new Set(['1 euro korting', 'Tweede kind', 'Kansentarief'])
      )
    })

    it('returns empty set when no discounts added', () => {
      expect(emptyDiscounts.names).toEqual(new Set())
    })
  })

  describe('namesSorted', () => {
    it('returns the name sorted alpabetically', () => {
      expect(exampleDiscounts.namesSorted).toEqual([
        '1 euro korting',
        'Kansentarief',
        'Tweede kind',
      ])
    })
  })

  describe('mayAddDiscount', () => {
    it('returns false if a discount with the same name already exists', () => {
      expect(
        exampleDiscounts.mayAddDiscount(
          Discount.createAbsoluteDiscount('Tweede kind', Price.fromCents(200))
        )
      ).toEqual(false)
    })
  })

  describe('discountWithNameExists', () => {
    it('true when discount with name exists', () => {
      expect(exampleDiscounts.discountWithNameExists('Kansentarief')).toEqual(
        true
      )
    })

    it('false when discount with name does not exists', () => {
      expect(exampleDiscounts.discountWithNameExists('Kansentarfie')).toEqual(
        false
      )
    })
  })

  describe('isEmpty', () => {
    it('true when no discounts', () => {
      expect(emptyDiscounts.isEmpty).toEqual(true)
    })

    it('false when discounts added', () => {
      expect(exampleDiscounts.isEmpty).toEqual(false)
    })
  })

  describe('withDiscountAdded', () => {
    it('does nothing when discount with same name is added', () => {
      expect(
        exampleDiscounts.withDiscountAdded(
          Discount.createAbsoluteDiscount('Kansentarief', Price.zero)
        )
      ).toEqual(exampleDiscounts)
    })
  })

  describe('withDiscountRenamed', () => {
    it('renames a discount', () => {
      expect(
        exampleDiscounts.withDiscountRenamed('Tweede kind', 'Derde kind')
      ).toMatchSnapshot()
    })

    it('does nothing when old name does not exist', () => {
      expect(exampleDiscounts.withDiscountRenamed('aoeu', 'Test')).toEqual(
        exampleDiscounts
      )
    })

    it('does nothing when new name already taken', () => {
      expect(
        exampleDiscounts.withDiscountRenamed('Tweede kind', '1 euro korting')
      ).toEqual(exampleDiscounts)
    })
  })

  describe('withDiscountRemoved', () => {
    it('does nothing with name is not added', () => {
      expect(exampleDiscounts.withDiscountRemoved('nope')).toEqual(
        exampleDiscounts
      )
    })

    it('removes discount', () => {
      expect(
        exampleDiscounts.withDiscountRemoved('Tweede kind')
      ).toMatchSnapshot()
    })
  })
})
