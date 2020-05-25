import { Bubble } from './bubble'

describe('Bubble', () => {
  describe('isEmpty', () => {
    it('true if no children', () => {
      const bubble = Bubble.create('name', 40, [])

      expect(bubble.isEmpty).toBe(true)
    })

    it('false if children assigned', () => {
      const bubble = Bubble.create('name', 40, ['my-child-id'])

      expect(bubble.isEmpty).toBe(false)
    })
  })

  describe('isFull', () => {
    it('false if no children', () => {
      const bubble = Bubble.create('name', 40, [])

      expect(bubble.isFull).toBe(false)
    })

    it('false if has children but not at capacity', () => {
      const bubble = Bubble.create('name', 40, [
        'my-child-id',
        'another-child-id',
      ])

      expect(bubble.isFull).toBe(false)
    })

    it('true if at capacity', () => {
      const bubble = Bubble.create('name', 5, [
        'my-child-id-1',
        'my-child-id-2',
        'my-child-id-3',
        'my-child-id-4',
        'my-child-id-5',
      ])

      expect(bubble.isFull).toBe(true)
    })

    it('true if over capacity', () => {
      const bubble = Bubble.create('name', 5, [
        'my-child-id-1',
        'my-child-id-2',
        'my-child-id-3',
        'my-child-id-4',
        'my-child-id-5',
        'my-child-id-6',
      ])

      expect(bubble.isFull).toBe(true)
    })
  })

  test('childIdsInBubble', () => {
    const bubble = Bubble.create('name', 40, [
      'my-child-id',
      'another-child-id',
    ])

    expect(bubble.childIdsInBubble).toEqual(['my-child-id', 'another-child-id'])
  })

  describe('includesChild', () => {
    it('true if child in child ids', () => {
      const bubble = Bubble.create('name', 40, [
        'my-child-id',
        'another-child-id',
      ])

      expect(bubble.includesChild('my-child-id')).toEqual(true)
    })
    it('false if child not in child ids', () => {
      const bubble = Bubble.create('name', 40, [
        'my-child-id',
        'another-child-id',
      ])

      expect(bubble.includesChild('unknown-child-id')).toEqual(false)
    })
  })
})
