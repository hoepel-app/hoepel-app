import { Bubbles } from './bubbles'
import { Bubble } from './bubble'

describe('Bubbles', () => {
  const exampleBubbles = Bubbles.createEmpty('my-tenant-id')
    .withBubbleAdded(
      Bubble.create('Bubbel Blauw', 40)
        .withChildAdded('week-40', 'child-id-1')
        .withChildAdded('week-40', 'child-id-2')
    )
    .withBubbleAdded(
      Bubble.create('Bubbel Paars', 45).withChildAdded('week-40', 'child-id-3')
    )

  test('bubbles', () => {
    expect(exampleBubbles.bubbles).toMatchInlineSnapshot(`
      Array [
        Bubble {
          "props": Object {
            "childAssignments": Array [
              Object {
                "childIds": Array [
                  "child-id-1",
                  "child-id-2",
                ],
                "weekIdentifier": "week-40",
              },
            ],
            "maxChildren": 40,
            "name": "Bubbel Blauw",
          },
        },
        Bubble {
          "props": Object {
            "childAssignments": Array [
              Object {
                "childIds": Array [
                  "child-id-3",
                ],
                "weekIdentifier": "week-40",
              },
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
      exampleBubbles.findBubbleChildIsAssignedTo('week-40', 'child-id-3')?.name
    ).toEqual('Bubbel Paars')
    expect(
      exampleBubbles.findBubbleChildIsAssignedTo('week-41', 'child-id-3')
    ).toBeNull()
    expect(
      exampleBubbles.findBubbleChildIsAssignedTo('week-40', 'blah-child-id')
    ).toBeNull()
  })

  test('childIsAssignedABubble', () => {
    expect(
      exampleBubbles.childIsAssignedABubble('week-40', 'child-id-1')
    ).toBeTruthy()
    expect(
      exampleBubbles.childIsAssignedABubble('week-41', 'child-id-1')
    ).toBeFalsy()
    expect(
      exampleBubbles.childIsAssignedABubble('week-40', 'blah-id')
    ).toBeFalsy()
  })

  test('withChildRemovedFromBubble', () => {
    expect(
      exampleBubbles.withChildRemovedFromBubble(
        'Bubbel Paars',
        'week-40',
        'child-id-3'
      )
    ).toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-1",
                    "child-id-2",
                  ],
                  "weekIdentifier": "week-40",
                },
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [],
                  "weekIdentifier": "week-40",
                },
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

  test('withChildAddedToBubble', () => {
    expect(
      exampleBubbles.withChildAddedToBubble(
        'Bubbel Paars',
        'week-40',
        'child-id-4'
      )
    ).toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-1",
                    "child-id-2",
                  ],
                  "weekIdentifier": "week-40",
                },
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-3",
                    "child-id-4",
                  ],
                  "weekIdentifier": "week-40",
                },
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
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-1",
                    "child-id-2",
                  ],
                  "weekIdentifier": "week-40",
                },
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-3",
                  ],
                  "weekIdentifier": "week-40",
                },
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
    expect(exampleBubbles.withRenamedBubble('Bubbel Paars', 'Bubbel Groen'))
      .toMatchInlineSnapshot(`
      Bubbles {
        "props": Object {
          "bubbles": Array [
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-1",
                    "child-id-2",
                  ],
                  "weekIdentifier": "week-40",
                },
              ],
              "maxChildren": 40,
              "name": "Bubbel Blauw",
            },
            Object {
              "childAssignments": Array [
                Object {
                  "childIds": Array [
                    "child-id-3",
                  ],
                  "weekIdentifier": "week-40",
                },
              ],
              "maxChildren": 45,
              "name": "Bubbel Groen",
            },
          ],
          "tenantId": "my-tenant-id",
        },
      }
    `)
  })

  test('allChildIdsAssignedToABubble', () => {
    expect(exampleBubbles.allChildIdsAssignedToABubble('week-40')).toEqual(
      new Set(['child-id-1', 'child-id-2', 'child-id-3'])
    )
    expect(exampleBubbles.allChildIdsAssignedToABubble('week-44')).toEqual(
      new Set([])
    )
  })

  test('assignmentsForChild', () => {
    const bubbles = Bubbles.createEmpty('my-tenant-id')
      .withBubbleAdded(
        Bubble.create('Bubbel Blauw', 40)
          .withChildAdded('week-40', 'child-id-1')
          .withChildAdded('week-40', 'child-id-2')
          .withChildAdded('week-41', 'child-id-2')
      )
      .withBubbleAdded(
        Bubble.create('Bubbel Paars', 45)
          .withChildAdded('week-40', 'child-id-3')
          .withChildAdded('week-44', 'child-id-2')
      )

    expect(bubbles.assignmentsForChild('child-id-3')).toMatchInlineSnapshot(`
      Array [
        Object {
          "bubbleName": "Bubbel Paars",
          "weekIdentifier": "week-40",
        },
      ]
    `)
    expect(bubbles.assignmentsForChild('blah')).toEqual([])
  })
})
