type CollectionPermissions = {
    readPermission: string | null,
    writePermission: string | null,
    deletePermission: string | null,
    updatePermission: string | null,
}

/** Represents a collection in Firestore */
export abstract class Collection {
    constructor(protected collectionName: string, protected permissions: CollectionPermissions) {
        this.sanityCheckCollectionPermissions(permissions);
    }

    /** Checks if passed permissions pass some simple tests, like making sure 'child:write' is not assigned as a read permission */
    protected sanityCheckCollectionPermissions(permissions: CollectionPermissions) {
        const assertPermissionDoesNotInclude = (permission: string | null, operationName: 'read' | 'write' | 'update' | 'delete') => {
            if (permission == null) {
                return
            }
    
            const forbidden = {
                read: ['write', 'update', 'delete'],
                write: ['read', 'update', 'delete'],
                update: ['read', 'delete'],
                delete: ['read', 'update'],
            }
    
            const forbiddenWords = forbidden[operationName]
    
            forbiddenWords.forEach(forbiddenWord => {
                if (permission.includes(forbiddenWord)) {
                    throw new Error(`Permission for ${operationName} operation '${permission}' contains confusing word '${forbiddenWord}'. This is probably a mistake.`)
                }
            })
        }
    
        assertPermissionDoesNotInclude(permissions.readPermission, 'read')
        assertPermissionDoesNotInclude(permissions.writePermission, 'write')
        assertPermissionDoesNotInclude(permissions.deletePermission, 'delete')
        assertPermissionDoesNotInclude(permissions.updatePermission, 'update')
    }

    /** Returns Firestore rules for this collection */
    abstract get firestoreRules(): string

    /** Returns a Firestore rules functions that checks if a user has a permission for a tenant */
    protected get firestoreHasPermissionFunction(): string {
        return `function hasPermission(permission, tenant) {
    return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)/tenants/$(tenant)).data.permissions;
  }`
    }
}

export class IndexedByTenantCollection extends Collection {
    constructor(collectionName: string, permissions: CollectionPermissions, private allowPublicRead = false) {
        super(collectionName, permissions);
    }

    get firestoreRules(): string {
        const createRuleLine = (operationName: string, permission: string | null, tenant: string) => {
            if (permission == null) {
                return `allow ${operationName.padEnd(6)}: if false;`
            } else {
                return `allow ${operationName.padEnd(6)}: if hasPermission('${permission}', ${tenant});`
            }
        }

        const readRule = this.allowPublicRead ? 'allow read:   if true;' : createRuleLine('read', this.permissions.readPermission, 'resource.data.tenant');
        const writeRule = createRuleLine('write', this.permissions.writePermission, 'request.resource.data.tenant');
        const updateRule = createRuleLine('update', this.permissions.updatePermission, 'resource.data.tenant');
        const deleteRule = createRuleLine('delete', this.permissions.deletePermission, 'resource.data.tenant');
        
        const rule = 
`// Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.tenant == tenant name)
match /databases/{database}/documents/${this.collectionName}/{document} {
  ${this.firestoreHasPermissionFunction}
  ${writeRule}
  ${readRule}
  ${updateRule}
  ${deleteRule}
}`
            return rule
        }
}

export class DocPerTenantCollection extends Collection {
    constructor(collectionName: string, permissions: { readPermission: string, writePermission: string }) {
        super(collectionName, {
            readPermission: permissions.readPermission,
            writePermission: permissions.writePermission,
            deletePermission: permissions.writePermission,
            updatePermission: permissions.writePermission,
        })
    }
    
    get firestoreRules(): string {
        return `// Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.id == tenant name)
match /databases/{database}/documents/${this.collectionName}/{document} {
  ${this.firestoreHasPermissionFunction}
  allow read: if !exists(/databases/$(database)/documents/${this.collectionName}/$(document)) || hasPermission('${this.permissions.readPermission}', document);
  allow write: if hasPermission('${this.permissions.writePermission}', document);
}`
    }
}

export class DocPerUserCollection extends Collection {
    constructor(collectionName: string) {
        super(collectionName, {
            deletePermission: null,
            readPermission: null,
            updatePermission: null,
            writePermission: null,
        })
    } 
    
    get firestoreRules(): string {
        return `// Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.id == user id)
match /databases/{database}/documents/users/{uid} {
  allow read: if uid == request.auth.uid;
    
  match /{document=**} {
    allow read: if uid == request.auth.uid;
  }
}`
    }
}
