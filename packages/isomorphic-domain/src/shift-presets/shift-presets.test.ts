import { ShiftPresets } from './shift-presets'
import { ShiftPreset } from './shift-preset'
import { Price } from '@hoepel.app/types'

describe('ShiftPresets', () => {
  const shiftPresets = ShiftPresets.createEmpty('my-tenant-id')
    .withPresetAdded(ShiftPreset.createEmpty('My Preset'))
    .withPresetAdded(
      ShiftPreset.createEmpty('Another Preset').withChildrenCanAttend(false)
    )
    .withPresetAdded(
      ShiftPreset.createEmpty('External activity').withPrice(
        Price.fromCents(2000)
      )
    )

  test('tenantId', () => {
    const presets = ShiftPresets.createEmpty('my-tenant-name')
    expect(presets.tenantId).toEqual('my-tenant-name')
  })

  test('id', () => {
    const presets = ShiftPresets.createEmpty('my-tenant-name')
    expect(presets.id).toEqual('my-tenant-name-shift-presets')
  })

  describe('numPresets', () => {
    it('returns number of presets', () => {
      expect(shiftPresets.numPresets).toEqual(3)
    })
  })

  describe('names', () => {
    it('returns names in use', () => {
      expect(shiftPresets.names).toEqual(
        new Set(['My Preset', 'Another Preset', 'External activity'])
      )
    })
  })

  describe('namesSorted', () => {
    it('returns names in use', () => {
      expect(shiftPresets.namesSorted).toEqual([
        'Another Preset',
        'External activity',
        'My Preset',
      ])
    })
  })

  describe('hasPresetWithName', () => {
    it('true when preset exists', () => {
      expect(shiftPresets.hasPresetWithName('External activity')).toEqual(true)
    })

    it('false when preset does not exist', () => {
      expect(shiftPresets.hasPresetWithName('nothing')).toEqual(false)
    })
  })

  describe('getPresetWithName', () => {
    it('null when preset cannot be found', () => {
      expect(shiftPresets.findPresetWithName('does not exist')).toBeNull()
    })

    it('returns found preset', () => {
      const preset = ShiftPreset.createEmpty('My new preset')
      const presets = ShiftPresets.createEmpty('tenant').withPresetAdded(preset)

      expect(presets.findPresetWithName('My new preset')).toEqual(preset)
    })
  })

  describe('withPresetAdded', () => {
    it('adds a new preset', () => {
      const empty = ShiftPresets.createEmpty('something')
      const preset = ShiftPreset.createEmpty('Some preset')

      expect(empty.numPresets).toEqual(0)
      expect(empty.withPresetAdded(preset).numPresets).toEqual(1)
      expect(empty.withPresetAdded(preset)).toMatchInlineSnapshot(`
        ShiftPresets {
          "props": Object {
            "shiftPresets": Array [
              Object {
                "childrenCanAttend": true,
                "crewMembersCanAttend": true,
                "description": "",
                "location": "",
                "name": "Some preset",
                "priceCents": 0,
              },
            ],
            "tenantId": "something",
          },
        }
      `)
    })

    it('overwrites existing shift preset with same name', () => {
      const presetWithThisNameExists = ShiftPreset.createEmpty(
        'External activity'
      ).withDescription('Some description')

      expect(
        shiftPresets.withPresetAdded(presetWithThisNameExists).numPresets
      ).toEqual(shiftPresets.numPresets)

      expect(
        shiftPresets.withPresetAdded(presetWithThisNameExists)
      ).not.toEqual(shiftPresets)
    })
  })

  describe('withPresetRemoved', () => {
    it('removes a preset', () => {
      expect(shiftPresets.hasPresetWithName('My Preset')).toEqual(true)

      expect(
        shiftPresets
          .withPresetRemoved('My Preset')
          .hasPresetWithName('My Preset')
      ).toEqual(false)
    })

    it('does nothing if preset to remove does not exist', () => {
      const tryRemove = shiftPresets.withPresetRemoved('does not exist')

      expect(tryRemove).toEqual(shiftPresets)
    })
  })

  describe('withPresetRenamed', () => {
    it('renames a preset', () => {
      const renamed = shiftPresets.withPresetRenamed('My Preset', 'My New Name')

      expect(renamed.names).toEqual(
        new Set(['My New Name', 'Another Preset', 'External activity'])
      )

      expect(renamed.hasPresetWithName('My Preset')).toEqual(false)
      expect(renamed.hasPresetWithName('My New Name')).toEqual(true)
    })

    it('does nothing when old name does not exist', () => {
      const renamed = shiftPresets.withPresetRenamed(
        'does not exist',
        'whatever'
      )

      expect(renamed).toEqual(shiftPresets)
    })

    it('does nothing when new name already exists', () => {
      const renamed = shiftPresets.withPresetRenamed(
        'External activity',
        'My Preset'
      )
      expect(renamed).toEqual(shiftPresets)
    })
  })

  describe('mayAddPreset', () => {
    it('false when preset with name already exists', () => {
      const addMe = ShiftPreset.createEmpty('Another Preset')

      expect(shiftPresets.mayAddPreset(addMe)).toEqual(false)
    })

    it('true when preset with name does not exist already', () => {
      const addMe = ShiftPreset.createEmpty("I'm new")

      expect(shiftPresets.mayAddPreset(addMe)).toEqual(true)
    })
  })

  describe('withPresetPriceChanged', () => {
    it('does nothing when preset does not exist', () => {
      const newPrice = Price.fromCents(1234)

      expect(shiftPresets.withPresetPriceChanged('Blah', newPrice)).toEqual(
        shiftPresets
      )
    })

    it('changes shift preset price', () => {
      const newPrice = Price.fromCents(1234)
      const changed = shiftPresets.withPresetPriceChanged('My Preset', newPrice)

      expect(changed.findPresetWithName('My Preset')?.price.totalCents).toEqual(
        1234
      )
      expect(changed).not.toEqual(shiftPresets)
    })
  })

  describe('withPresetLocationChanged', () => {
    it('does nothing when preset does not exist', () => {
      expect(
        shiftPresets.withPresetLocationChanged('Blah', 'New location')
      ).toEqual(shiftPresets)
    })

    it('changes shift preset location', () => {
      const changed = shiftPresets.withPresetLocationChanged(
        'My Preset',
        'New location'
      )

      expect(changed.findPresetWithName('My Preset')?.location).toEqual(
        'New location'
      )
      expect(changed).not.toEqual(shiftPresets)
    })
  })

  describe('withPresetDescriptionChanged', () => {
    it('does nothing when preset does not exist', () => {
      expect(
        shiftPresets.withPresetDescriptionChanged(
          'Some shift preset',
          'New location'
        )
      ).toEqual(shiftPresets)
    })

    it('changes shift preset location', () => {
      const changed = shiftPresets.withPresetDescriptionChanged(
        'My Preset',
        'New description'
      )

      expect(changed.findPresetWithName('My Preset')?.description).toEqual(
        'New description'
      )
      expect(changed).not.toEqual(shiftPresets)
    })
  })

  describe('withPresetCrewMembersCanAttendChanged', () => {
    it('does nothing when preset does not exist', () => {
      expect(
        shiftPresets.withPresetCrewMembersCanAttendChanged(
          'Some shift preset',
          false
        )
      ).toEqual(shiftPresets)
    })

    it('changes shift preset location', () => {
      const changed = shiftPresets.withPresetCrewMembersCanAttendChanged(
        'My Preset',
        false
      )

      expect(
        changed.findPresetWithName('My Preset')?.crewMembersCanAttend
      ).toEqual(false)
      expect(changed).not.toEqual(shiftPresets)
    })
  })

  describe('withPresetChildrenCanAttendChanged', () => {
    it('does nothing when preset does not exist', () => {
      expect(
        shiftPresets.withPresetChildrenCanAttendChanged(
          'Some shift preset',
          false
        )
      ).toEqual(shiftPresets)
    })

    it('changes shift preset location', () => {
      const changed = shiftPresets.withPresetChildrenCanAttendChanged(
        'My Preset',
        false
      )

      expect(
        changed.findPresetWithName('My Preset')?.childrenCanAttend
      ).toEqual(false)
      expect(changed).not.toEqual(shiftPresets)
    })
  })
})
