import { schema } from './schema'
import { createFirestoreRulesFromSchema } from './schema-to-firestore/create-firestore-rules-from-schema'
import { Rule } from './firestore/rule'

export const allRules = createFirestoreRulesFromSchema(schema, [
    new Rule({
        // TODO Redundant with next rule? Sub-documents are not created I think
        match: '/databases/{database}/documents/tenants/{document=**}',
        comment: 'Admin may create tenants',
        allowCreate: 'request.auth.token.isAdmin',
        allowDelete: false,
        allowRead: false,
        allowUpdate: false,
    }),
    new Rule({
        match: '/databases/{database}/documents/tenants/{tenant}',
        comment: 'Allow users to read own tenant, admin and tenant users to CRU',
        allowCreate: `request.auth.token.isAdmin || hasPermission('tenant:write', tenant)`,
        allowRead: `request.auth.token.isAdmin || exists(/databases/$(database)/documents/users/$(request.auth.uid)/tenants/$(tenant))`,
        allowUpdate: `request.auth.token.isAdmin || hasPermission('tenant:write', tenant)`,
        allowDelete: false,
        extra: `function hasPermission(permission, tenant) { return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)/tenants/$(tenant)).data.permissions; }`
    })
])

console.log(allRules)
