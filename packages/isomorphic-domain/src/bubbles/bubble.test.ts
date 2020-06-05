import { Bubble } from './bubble'

describe('Bubble', () => {
  describe('isEmpty', () => {
    it('true if no children', () => {
      const bubble = Bubble.create('name', 40)

      expect(bubble.isEmpty('2020-11')).toBe(true)
    })

    it('false if children assigned', () => {
      const bubble = Bubble.create('name', 40).withChildAdded(
        '2020-11',
        'my-child-id'
      )

      expect(bubble.isEmpty('2020-11')).toBe(false)
      expect(bubble.isEmpty('2020-12')).toBe(true)
    })
  })

  describe('isFull', () => {
    it('false if no children', () => {
      const bubble = Bubble.create('name', 40)

      expect(bubble.isFull('2020-22')).toBe(false)
    })

    it('false if has children but not at capacity', () => {
      const bubble = Bubble.create('name', 40)
        .withChildAdded('2020-22', 'child-1')
        .withChildAdded('2020-22', 'child-2')

      expect(bubble.isFull('2020-22')).toBe(false)
    })

    it('true if at capacity', () => {
      const bubble = Bubble.create('name', 5)
        .withChildAdded('week-40', 'child-1')
        .withChildAdded('week-40', 'child-2')
        .withChildAdded('week-40', 'child-3')
        .withChildAdded('week-40', 'child-4')
        .withChildAdded('week-40', 'child-5')

      expect(bubble.isFull('week-40')).toBe(true)
      expect(bubble.isFull('week-42')).toBe(true)
    })

    it('true if over capacity', () => {
      const bubble = Bubble.create('name', 5)
        .withChildAdded('week-40', 'child-1')
        .withChildAdded('week-40', 'child-2')
        .withChildAdded('week-40', 'child-3')
        .withChildAdded('week-40', 'child-4')
        .withChildAdded('week-40', 'child-5')
        .withChildAdded('week-40', 'child-6')
        .withChildAdded('week-44', 'child-5')
        .withChildAdded('week-44', 'child-6')

      expect(bubble.isFull('week-40')).toBe(true)
      expect(bubble.isFull('week-44')).toBe(false)
    })
  })

  test('childIdsInBubble', () => {
    const bubble = Bubble.create('name', 40)
      .withChildAdded('week-40', 'child-1')
      .withChildAdded('week-40', 'child-2')

    expect(bubble.childIdsInBubble('week-40')).toEqual([
      'my-child-id',
      'another-child-id',
    ])
    expect(bubble.childIdsInBubble('week-42')).toEqual([])
  })

  test('includesChild', () => {
    const bubble = Bubble.create('name', 40)
      .withChildAdded('week-40', 'my-child-id')
      .withChildAdded('week-44', 'child-5')

    expect(bubble.includesChild('week-40', 'my-child-id')).toEqual(true)
    expect(bubble.includesChild('week-44', 'my-child-id')).toEqual(false)
    expect(bubble.includesChild('week-10', 'my-child-id')).toEqual(false)
  })
})
