import { Collection } from "./collection"
import { Rule } from "./rule"

export class DocPerTenantCollection extends Collection {
    constructor(collectionName: string, permissions: { readPermission: string, writePermission: string }) {
        super(collectionName, {
            readPermission: permissions.readPermission,
            writePermission: permissions.writePermission,
            deletePermission: permissions.writePermission,
            updatePermission: permissions.writePermission,
        })
    }
    
    get firestoreRules() {
        return [
            new Rule({
            comment: `Generated permissions for collection '${this.collectionName}' (collection contains docs with doc.id == tenant name)`,
            match: `/databases/{database}/documents/${this.collectionName}/{document}`,
            extra: this.firestoreHasPermissionFunction,
            allowRead: `!exists(/databases/$(database)/documents/${this.collectionName}/$(document)) || hasPermission('${this.permissions.readPermission}', document)`,
            allowCreate: `hasPermission('${this.permissions.writePermission}', document)`,
            allowDelete: false,
            allowUpdate: `hasPermission('${this.permissions.writePermission}', document)`
        })
    ]
    }
}
