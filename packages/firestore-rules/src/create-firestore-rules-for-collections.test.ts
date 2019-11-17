import {
  Rule,
  IndexedByTenantCollection,
  DocPerTenantCollection,
  DocPerUserCollection,
} from '@hoepel.app/schema-firestore'
import { createFirestoreRulesForCollections } from './create-firestore-rules-for-collections'

describe('createFirestoreRulesForCollections', () => {
  it('creates Firestore rules for a list of collections', () => {
    const created = createFirestoreRulesForCollections(
      [
        new IndexedByTenantCollection('tenant-indexed', {
          writePermission: 'write-permission',
          readPermission: 'read-permission',
          updatePermission: 'update-permission',
          deletePermission: 'delete-permission',
        }),
        new DocPerTenantCollection('doc-per-tenant', {
          readPermission: 'doc-read-perm',
          writePermission: 'doc-write-perm',
        }),
        new DocPerUserCollection('doc-per-user'),
      ],
      [
        new Rule({
          match: '/my/match/thingie',
          comment: 'My extra comment',
          allowCreate: true,
          allowRead: 'my custom thingie',
          allowUpdate: false,
          allowDelete: true,
        }),
      ]
    )

    expect(created).toMatchSnapshot()
  })
})
