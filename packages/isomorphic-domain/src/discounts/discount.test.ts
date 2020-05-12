import { Discount } from './discount'
import { Price } from '@hoepel.app/types'

describe('Discount', () => {
  const absoluteDiscount = Discount.createAbsoluteDiscount(
    'Tweede kind',
    Price.fromCents(200)
  )
  const relativeDiscount = Discount.createRelativeDiscount('Kansentarief', 60)

  test('serializing then deserializing yields same result object', () => {
    const testSerialize = (discount: Discount): Discount =>
      Discount.fromProps(JSON.parse(JSON.stringify(discount.toProps())))

    const relativeDiscount = Discount.createRelativeDiscount('Test', 55)

    expect(testSerialize(absoluteDiscount)).toEqual(absoluteDiscount)
    expect(testSerialize(relativeDiscount)).toEqual(relativeDiscount)
  })

  describe('name', () => {
    it('returns name of the discount', () => {
      expect(absoluteDiscount.name).toEqual('Tweede kind')
    })
  })

  describe('createRelativeDiscount', () => {
    it('creates a relative discount', () => {
      expect(Discount.createRelativeDiscount('Korting', 30)).toMatchSnapshot()
    })

    it('rounds floating point percentages', () => {
      const discount = Discount.createRelativeDiscount('Korting', 66.66666)
      expect(discount).toMatchSnapshot()
    })

    it('uses 0% as the minimum', () => {
      const discount = Discount.createRelativeDiscount('Korting', -20)
      expect(discount).toMatchSnapshot()
    })

    it('uses 100% as the maximum', () => {
      const discount = Discount.createRelativeDiscount('Korting', 150)
      expect(discount).toMatchSnapshot()
    })

    it('falls back to 0 if percentage is not a number', () => {
      const discountString = Discount.createRelativeDiscount(
        'Korting',
        ('aoue' as unknown) as number
      )
      const discountNaN = Discount.createRelativeDiscount('Korting', NaN)

      expect(discountString).toEqual(
        Discount.createRelativeDiscount('Korting', 0)
      )
      expect(discountNaN).toEqual(Discount.createRelativeDiscount('Korting', 0))
    })
  })

  describe('createAbsoluteDiscount', () => {
    it('creates an absolute discount', () => {
      expect(
        Discount.createAbsoluteDiscount('Korting', Price.fromCents(100))
      ).toMatchSnapshot()
    })
  })

  describe('applyAllDiscounts', () => {
    const halfOff = Discount.createRelativeDiscount('Half off', 50)
    const noDiscount = Discount.createRelativeDiscount('No discount', 0)
    const sixtyPercentOff = Discount.createRelativeDiscount('60% off', 60)
    const allOff = Discount.createRelativeDiscount('Free!', 100)

    it('applies multiple relative discounts', () => {
      expect(
        Discount.applyAllDiscounts(Price.fromCents(10000), [
          halfOff,
          noDiscount,
          sixtyPercentOff,
        ])
      ).toEqual(Price.fromCents(2000))

      expect(
        Discount.applyAllDiscounts(Price.fromCents(100), [
          halfOff,
          noDiscount,
          allOff,
        ])
      ).toEqual(Price.zero)
    })

    it('applies multiple absolute discounts', () => {
      expect(
        Discount.applyAllDiscounts(Price.fromCents(10000), [
          Discount.createAbsoluteDiscount('Test1', Price.fromCents(50)),
          Discount.createAbsoluteDiscount('Test2', Price.fromCents(50)),
          Discount.createAbsoluteDiscount('Test3', Price.fromCents(0)),
          Discount.createAbsoluteDiscount('Test4', Price.fromCents(111)),
        ])
      ).toEqual(Price.fromCents(9789))
    })

    it('applies mixed discounts', () => {
      expect(
        Discount.applyAllDiscounts(Price.fromCents(10000), [
          halfOff,
          Discount.createAbsoluteDiscount('Test1', Price.fromCents(50)),
          sixtyPercentOff,
          Discount.createAbsoluteDiscount('Test2', Price.fromCents(50)),
          Discount.createAbsoluteDiscount('Test3', Price.fromCents(0)),
          noDiscount,
          Discount.createAbsoluteDiscount('Test4', Price.fromCents(111)),
        ])
      ).toEqual(Price.fromCents(1819))
    })
  })

  describe('sorted', () => {
    it('sorts discounts', () => {
      const discounts = [
        relativeDiscount,
        absoluteDiscount,
        Discount.createRelativeDiscount('Test', 0),
        Discount.createRelativeDiscount('Blah', 0),
      ]

      expect(Discount.sorted(discounts).map((d) => d.name)).toEqual([
        'Blah',
        'Kansentarief',
        'Test',
        'Tweede kind',
      ])
    })
  })

  describe('isRelativeDiscount', () => {
    it('true for relative discount', () => {
      expect(relativeDiscount.isRelativeDiscount).toEqual(true)
    })

    it('false for absolute discount', () => {
      expect(absoluteDiscount.isRelativeDiscount).toEqual(false)
    })
  })

  describe('isAbsoluteDiscount', () => {
    it('true for absolute discount', () => {
      expect(absoluteDiscount.isAbsoluteDiscount).toEqual(true)
    })

    it('false for relative discount', () => {
      expect(relativeDiscount.isAbsoluteDiscount).toEqual(false)
    })
  })

  describe('applyTo', () => {
    describe('relative discount', () => {
      const halfOff = Discount.createRelativeDiscount('Half off', 50)
      const noDiscount = Discount.createRelativeDiscount('No discount', 0)
      const sixtyPercentOff = Discount.createRelativeDiscount('60% off', 60)
      const allOff = Discount.createRelativeDiscount('Free!', 100)

      test('50% off 0.00EUR is 0.00EUR', () => {
        expect(halfOff.applyTo(Price.zero)).toEqual(Price.zero)
      })

      test('50% off 1.00EUR is 0.50EUR', () => {
        expect(halfOff.applyTo(Price.fromCents(100))).toEqual(
          Price.fromCents(50)
        )
      })

      test('0% off 15.17EUR is 15.00EUR', () => {
        const price = Price.fromCents(1517)
        expect(noDiscount.applyTo(price)).toEqual(price)
      })

      test('0% off 0.00EUR is 0.00EUR', () => {
        expect(noDiscount.applyTo(Price.zero)).toEqual(Price.zero)
      })

      test('60% off 20.00EUR is 8.00EUR', () => {
        expect(sixtyPercentOff.applyTo(Price.fromCents(2000))).toEqual(
          Price.fromCents(800)
        )
      })

      test('60% off 13.57EUR is 5.43EUR', () => {
        expect(sixtyPercentOff.applyTo(Price.fromCents(1357))).toEqual(
          Price.fromCents(543)
        )
      })

      test('60% off 13.58EUR is 5.43EUR', () => {
        expect(sixtyPercentOff.applyTo(Price.fromCents(1358))).toEqual(
          Price.fromCents(543)
        )
      })

      test('100% off 0.00EUR is 0.00EUR', () => {
        expect(allOff.applyTo(Price.zero)).toEqual(Price.zero)
      })

      test('100% off 13.57EUR is 0.00EUR', () => {
        expect(allOff.applyTo(Price.fromCents(1357))).toEqual(Price.zero)
      })
    })

    describe('absolute discount', () => {
      const oneEurOff = Discount.createAbsoluteDiscount(
        '1 euro korting',
        Price.fromCents(100)
      )

      const weirdOff = Discount.createAbsoluteDiscount(
        '1.23 euro korting',
        Price.fromCents(123)
      )

      test('1.00EUR off 5.00EUR is 4.00EUR', () => {
        expect(oneEurOff.applyTo(Price.fromCents(500))).toEqual(
          Price.fromCents(400)
        )
      })

      test('1.00EUR off 0.00EUR is 0.00EUR', () => {
        expect(oneEurOff.applyTo(Price.zero)).toEqual(Price.fromCents(0))
      })

      test('1.23EUR off 14.05EUR is 12.82EUR', () => {
        expect(weirdOff.applyTo(Price.fromCents(1405))).toEqual(
          Price.fromCents(1282)
        )
      })

      test('1.23EUR off 0.56EUR is 0.00EUR', () => {
        expect(weirdOff.applyTo(Price.fromCents(56))).toEqual(Price.zero)
      })
    })
  })

  describe('discountPercentage', () => {
    it('gets discount percentage for relative discount', () => {
      expect(relativeDiscount.discountPercentage).toEqual(60)
    })

    it('returns 0% when discount is absolute', () => {
      expect(absoluteDiscount.discountPercentage).toEqual(0)
    })
  })

  describe('absoluteDiscount', () => {
    it('gets price to be subtracted for absolute discount', () => {
      expect(absoluteDiscount.absoluteDiscount).toEqual(Price.fromCents(200))
    })

    it('returns zero for relative discount', () => {
      expect(relativeDiscount.absoluteDiscount).toEqual(Price.zero)
    })
  })

  describe('withName', () => {
    it('renames a discount', () => {
      expect(absoluteDiscount.withName('New name').name).toEqual('New name')
    })
  })
})
