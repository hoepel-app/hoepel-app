import { GraphQLSchema, buildSchema } from "graphql";

export const schema = `

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

type ContactPerson @firestore(name:"contact-people", type:INDEXED_BY_TENANT, readPermission:"contact-person:read", writePermission:"contact-person:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type CrewMember @firestore(name:"crew-members", type:INDEXED_BY_TENANT, readPermission:"crew-member:read", writePermission:"crew-member:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type Discount @firestore(name:"discounts", type:DOC_PER_TENANT, readPermission:"discounts:read", writePermission:"discounts:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type Report @firestore(name:"reports", type:INDEXED_BY_TENANT, readPermission:"reports:read") {
    id: ID!
}

type ShiftPreset @firestore(name:"shift-presets", type:DOC_PER_TENANT, readPermission:"shift-preset:read", writePermission:"shift-preset:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type Shift @firestore(name:"shifts", type:INDEXED_BY_TENANT, readPermission:"shift:read", writePermission:"shift:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type Template @firestore(name:"templates", type:INDEXED_BY_TENANT, readPermission:"template:read", writePermission:"template:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}


type ChildAttendanceByChild @firestore(name:"child-attendances-by-child", type:INDEXED_BY_TENANT, allowPublicRead: true) {
    id: ID!
}

type ChildAttendanceByShift @firestore(name:"child-attendances-by-shift", type:INDEXED_BY_TENANT, allowPublicRead: true) {
    id: ID!
}

type ChildAttendanceAdd @firestore(name:"child-attendances-add", type:INDEXED_BY_TENANT, writePermission:"child-attendance:write", allowPublicRead: true) {
    id: ID!
}

type ChildAttendanceDelete @firestore(name:"child-attendances-delete", type:INDEXED_BY_TENANT, writePermission:"child-attendance:write", allowPublicRead: true) {
    id: ID!
}


type CrewAttendanceAdd @firestore(name:"crew-attendances-add", type:INDEXED_BY_TENANT, allowPublicRead: true, writePermission:"crew-attendance:write") {
    id: ID!
}

type CrewAttendanceDelete @firestore(name:"crew-attendances-delete", type:INDEXED_BY_TENANT, allowPublicRead: true, writePermission:"crew-attendance:write") {
    id: ID!
}

type CrewAttendanceByCrew @firestore(name:"crew-attendances-by-crew", type:INDEXED_BY_TENANT, allowPublicRead: true) {
    id: ID!
}

type CrewAttendanceByShift @firestore(name:"crew-attendances-by-shift", type:INDEXED_BY_TENANT, allowPublicRead: true) {
    id: ID!
}


type User @firestore(name:"users", type:DOC_PER_USER) {
    id: ID!
}

type Tenant @firestore(name:"tenants", type:DOC_PER_TENANT, readPermission:"TODO:read", writePermission:"TODO:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}


type Query {
    me: String
}

#type Mutation {
    #createUser(name: String): User
#}

schema {
    query: Query
    #mutation: Mutation
}`

export const graphqlSchema: GraphQLSchema = buildSchema(schema)
