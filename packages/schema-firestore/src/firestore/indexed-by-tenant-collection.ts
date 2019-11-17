import { Collection, CollectionPermissions } from './collection'
import { Rule } from './rule'

export class IndexedByTenantCollection extends Collection {
  constructor(
    collectionName: string,
    permissions: CollectionPermissions,
    private allowPublicRead = false
  ) {
    super(collectionName, permissions)
  }

  get firestoreRules(): readonly Rule[] {
    const createRuleLine = (
      permission: string | null,
      tenant: string
    ): string | boolean => {
      if (permission == null) {
        return false
      } else {
        return `hasPermission('${permission}', ${tenant})`
      }
    }

    let allowRead: string | boolean

    if (this.allowPublicRead) {
      allowRead = true
    } else if (!this.permissions.readPermission) {
      allowRead = false
    } else {
      allowRead = createRuleLine(
        this.permissions.readPermission,
        'resource.data.tenant'
      )
    }

    return [
      new Rule({
        comment: `Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.tenant == tenant name)`,
        match: `/databases/{database}/documents/${this.collectionName}/{document}`,
        extra: this.firestoreHasPermissionFunction,
        allowRead,
        allowCreate: createRuleLine(
          this.permissions.writePermission,
          'request.resource.data.tenant'
        ),
        allowUpdate: createRuleLine(
          this.permissions.updatePermission,
          'resource.data.tenant'
        ),
        allowDelete: createRuleLine(
          this.permissions.deletePermission,
          'resource.data.tenant'
        ),
      }),
    ]
  }
}
