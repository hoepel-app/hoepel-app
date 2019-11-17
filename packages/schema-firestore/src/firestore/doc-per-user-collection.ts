import { Rule } from './rule'
import { Collection } from './collection'

export class DocPerUserCollection extends Collection {
  constructor(collectionName: string) {
    super(collectionName, {
      deletePermission: null,
      readPermission: null,
      updatePermission: null,
      writePermission: null,
    })
  }

  get firestoreRules(): readonly Rule[] {
    const comment = `Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.id == user id)`
    return [
      new Rule({
        comment,
        match: '/databases/{database}/documents/users/{uid}',
        allowRead: 'uid == request.auth.uid',
        allowDelete: false,
        allowUpdate: false,
        allowCreate: false,
      }),
      new Rule({
        comment,
        match: '/databases/{database}/documents/users/{uid}/{document=**}',
        allowRead: 'uid == request.auth.uid',
        allowDelete: false,
        allowUpdate: false,
        allowCreate: false,
      }),
      new Rule({
        comment: comment + ' - Admin access',
        match: '/databases/{database}/documents/users/{document=**}',
        allowRead: 'request.auth.token.isAdmin',
        allowDelete: false,
        allowUpdate: 'request.auth.token.isAdmin',
        allowCreate: false,
      }),
    ]
  }
}
