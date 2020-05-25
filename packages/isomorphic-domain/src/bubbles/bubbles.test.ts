import { Bubbles } from './bubbles'
import { Bubble } from './bubble'

describe('Bubbles', () => {
  const exampleBubbles = Bubbles.createEmpty('my-tenant-id')
    .withBubbleAdded(
      Bubble.create('Bubbel Blauw', 40, ['child-id-1', 'child-id-2'])
    )
    .withBubbleAdded(Bubble.create('Bubbel Paars', 45, ['child-id-3']))

  test('bubbles', () => {
    expect(exampleBubbles.bubbles).toMatchInlineSnapshot(`
      Array [
        Bubble {
          "props": Object {
            "childIds": Array [
              "child-id-1",
              "child-id-2",
            ],
            "maxChildren": 40,
            "name": "Bubbel Blauw",
          },
        },
        Bubble {
          "props": Object {
            "childIds": Array [
              "child-id-3",
            ],
            "maxChildren": 45,
            "name": "Bubbel Paars",
          },
        },
      ]
    `)
  })

  test('findBubbleChildIsAssignedTo', () => {
    expect(
      exampleBubbles.findBubbleChildIsAssignedTo('child-id-3')?.name
    ).toEqual('Bubbel Paars')
    expect(
      exampleBubbles.findBubbleChildIsAssignedTo('blah-child-id')
    ).toBeNull()
  })

  test('childIsAssignedABubble', () => {
    expect(exampleBubbles.childIsAssignedABubble('child-id-1')).toBeTruthy()
    expect(exampleBubbles.childIsAssignedABubble('blah-id')).toBeFalsy()
  })

  test('withChildRemovedFromBubble', () => {
    expect(
      exampleBubbles.withChildRemovedFromBubble('Bubbel Paars', 'child-id-3')
    ).toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childIds": Array [
                "child-id-1",
                "child-id-2",
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childIds": Array [],
              "maxChildren": 45,
              "name": "Bubbel Paars",
            },
          ],
          "tenantId": "my-tenant-id",
        },
      }
    `)
  })

  test('withChildAddedToBubble', () => {
    expect(exampleBubbles.withChildAddedToBubble('Bubbel Paars', 'child-id-4'))
      .toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childIds": Array [
                "child-id-1",
                "child-id-2",
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childIds": Array [
                "child-id-3",
                "child-id-4",
              ],
              "maxChildren": 45,
              "name": "Bubbel Paars",
            },
          ],
          "tenantId": "my-tenant-id",
        },
      }
    `)
  })

  test('withChangedMaxChildrenForBubble', () => {
    expect(exampleBubbles.withChangedMaxChildrenForBubble('Bubbel Paars', 35))
      .toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childIds": Array [
                "child-id-1",
                "child-id-2",
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childIds": Array [
                "child-id-3",
              ],
              "maxChildren": 35,
              "name": "Bubbel Paars",
            },
          ],
          "tenantId": "my-tenant-id",
        },
      }
    `)
  })

  test('withRenamedBubble', () => {
    expect(
      exampleBubbles.withRenamedBubble('Bubbel Paars', 'Bubbel Groen')
    ).toMatchInlineSnapshot()
  })
})
