import { Consumables, Consumable } from './consumables'

describe('consumables', () => {
  it('id', () => {
    const consumables = Consumables.createEmpty(
      'my-tenant-id-here'
    ).withConsumableAdded(Consumable.create('Cookie', 250))

    expect(consumables.id).toEqual('my-tenant-id-here-consumables')
  })

  it('serializing and deserializing yields same object', () => {
    const consumables = Consumables.createEmpty('my-tenant-id-here')
      .withConsumableAdded(Consumable.create('Cookie', 250))
      .withConsumableAdded(Consumable.create('Soup', 300))

    const json = JSON.parse(JSON.stringify(consumables.toProps()))

    expect(Consumables.fromProps(json)).toEqual(consumables)
  })

  describe('consumables', () => {
    it('returns consumables in alphabetical order by name', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Soup', 250))
        .withConsumableAdded(Consumable.create('Cookie', 300))
        .withConsumableAdded(Consumable.create('ZZZ', 300))
        .withConsumableAdded(Consumable.create('Soft drink', 300))

      expect(consumables.consumables).toMatchSnapshot()
    })
  })

  describe('namesSorted', () => {
    it('returns consumable names in alphabetical order', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Soup', 250))
        .withConsumableAdded(Consumable.create('Cookie', 300))
        .withConsumableAdded(Consumable.create('ZZZ', 300))
        .withConsumableAdded(Consumable.create('Soft drink', 300))

      expect(consumables.namesSorted).toEqual([
        'Cookie',
        'Soft drink',
        'Soup',
        'ZZZ',
      ])
    })
  })

  describe('names', () => {
    it('returns the names of added consumables', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soft drink', 50))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.names).toEqual(
        new Set(['Cookie', 'Soup', 'Soft drink'])
      )
    })
  })

  describe('withConsumableAdded', () => {
    it('does not add consumable with same name twice', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Cookie', 300))

      expect(consumables.consumables).toHaveLength(1)
      expect(consumables.findConsumableByName('Cookie')).toMatchInlineSnapshot(`
        Consumable {
          "props": Object {
            "name": "Cookie",
            "priceCents": 250,
          },
        }
      `)
    })
  })

  describe('findConsumableByName', () => {
    it('finds existing consumable by name', () => {
      const consumables = Consumables.createEmpty(
        'my-tenant-id-here'
      ).withConsumableAdded(Consumable.create('Cookie', 250))

      expect(consumables.findConsumableByName('Cookie')).toMatchInlineSnapshot(`
        Consumable {
          "props": Object {
            "name": "Cookie",
            "priceCents": 250,
          },
        }
      `)
    })

    it('returns null if no consumable can be found', () => {
      const consumables = Consumables.createEmpty(
        'my-tenant-id-here'
      ).withConsumableAdded(Consumable.create('Cookie', 250))

      expect(consumables.findConsumableByName('Soup')).toBeNull()
    })
  })

  describe('withChangedPriceForConsumable', () => {
    it('changes the price of a consumable', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.withChangedPriceForConsumable('Cookie', 100))
        .toMatchInlineSnapshot(`
        Consumables {
          "props": Object {
            "consumables": Array [
              Object {
                "name": "Soup",
                "priceCents": 300,
              },
              Object {
                "name": "Cookie",
                "priceCents": 100,
              },
            ],
            "tenantId": "my-tenant-id-here",
          },
        }
      `)
    })

    it('does nothing when consumable does not exist', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.withChangedPriceForConsumable('Cooky', 100)).toEqual(
        consumables
      )
    })
  })

  describe('withConsumableRemoved', () => {
    it('removes a consumable', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.withConsumableRemoved('Cookie'))
        .toMatchInlineSnapshot(`
        Consumables {
          "props": Object {
            "consumables": Array [
              Object {
                "name": "Soup",
                "priceCents": 300,
              },
            ],
            "tenantId": "my-tenant-id-here",
          },
        }
      `)
    })

    it('does nothing when consumable does not exist', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.withConsumableRemoved('Cooky')).toEqual(consumables)
    })
  })

  describe('withConsumableRenamed', () => {
    const exampleConsumables = Consumables.createEmpty('my-tenant-id-here')
      .withConsumableAdded(Consumable.create('Cookie', 250))
      .withConsumableAdded(Consumable.create('Soft drink', 50))
      .withConsumableAdded(Consumable.create('Soup', 300))

    it('renames consumable', () => {
      expect(
        exampleConsumables.withRenamedConsumable(
          'Cookie',
          'Big Chocolate Cookie'
        )
      ).toMatchSnapshot()
    })

    it('does nothing when renaming non-existing consumable', () => {
      expect(
        exampleConsumables.withRenamedConsumable('Blah', 'Something')
      ).toEqual(exampleConsumables)
    })

    it('does nothing when renaming consumable to name already in use', () => {
      expect(
        exampleConsumables.withRenamedConsumable('Cookie', 'Soup')
      ).toEqual(exampleConsumables)
    })
  })

  describe('isEmpty', () => {
    it('true when no consumables added', () => {
      expect(Consumables.createEmpty('my-tenant-id').isEmpty).toEqual(true)
    })

    it('false when there are consumables added', () => {
      const consumables = Consumables.createEmpty('my-tenant-id-here')
        .withConsumableAdded(Consumable.create('Cookie', 250))
        .withConsumableAdded(Consumable.create('Soup', 300))

      expect(consumables.isEmpty).toEqual(false)
    })
  })
})

describe('consumable', () => {
  describe('create', () => {
    it('allows creating free consumable', () => {
      const consumable = Consumable.create('Water', 0)

      expect(consumable.price.totalCents).toEqual(0)
    })

    it('throws when creating with negative price', () => {
      expect(() =>
        Consumable.create('Water', -100)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Price in cents must be a positive number"`
      )
    })

    it('throws when creating with floating point price', () => {
      expect(() =>
        Consumable.create('Water', 66.66)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Price in cents must be an integer"`
      )
    })
  })
})
