import { Rule } from "./rule";

export type CollectionPermissions = {
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
    abstract get firestoreRules(): readonly Rule[]

    /** Returns a Firestore rules functions that checks if a user has a permission for a tenant */
    protected get firestoreHasPermissionFunction(): string {
        return `function hasPermission(permission, tenant) {
  return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)/tenants/$(tenant)).data.permissions;
}`
    }
}
