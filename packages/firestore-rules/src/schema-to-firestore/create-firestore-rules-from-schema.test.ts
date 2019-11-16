import { buildSchema } from 'graphql';
import { createFirestoreRulesFromSchema } from './create-firestore-rules-from-schema';

const testSchema = buildSchema(`
enum COLLECTION_TYPE {
    INDEXED_BY_TENANT
    DOC_PER_TENANT
    DOC_PER_USER
}

directive @firestore(
    name: String!
    type: COLLECTION_TYPE!
    readPermission: String
    writePermission: String
    allowDelete: Boolean
    allowUpdate: Boolean
    allowPublicRead: Boolean
) on OBJECT

type AgeGroup @firestore(name:"age-groups", type:DOC_PER_TENANT, readPermission:"age-groups:read", writePermission:"age-groups:write") {
    id: ID!
    name: String
}

type Child @firestore(name:"children", type: INDEXED_BY_TENANT, readPermission:"child:read", writePermission:"child:write", allowUpdate: true, allowDelete: true) {
    id: ID!
    name: String
}

type Consumable @firestore(name:"consumables", type:DOC_PER_TENANT, readPermission:"consumables:read", writePermission:"consumables:write") {
    id: ID!
}

type Consumption @firestore(name:"consumptions", type:INDEXED_BY_TENANT, readPermission:"consumption:read", writePermission:"consumption:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type User @firestore(name:"users", type:DOC_PER_USER) {
    id: ID!
}
`)

describe('createFirestoreRulesFromSchema', () => {
    it('create Firestore rules from schema', () => {
        expect(createFirestoreRulesFromSchema(testSchema)).toMatchSnapshot()
    })
})
