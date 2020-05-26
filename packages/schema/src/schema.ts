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

type Address {
    street: String
    number: String
    zipCode: Int
    city: String
}

type TenantAddress {
    streetAndNumber: String
    zipCode: Int
    city: String
}

type TenantContactPerson {
    name: String
    phone: String
    email: String
}

type PhoneContact {
    phoneNumber: String!
    comment: String
}

type ChildContactPersonRelation {
    relationship: String
    contactPerson: ContactPerson
}

type AgeGroup @firestore(name:"age-groups", type:DOC_PER_TENANT, readPermission:"age-groups:read", writePermission:"age-groups:write") {
    id: ID!
    name: String!
    # bornOnOrAfter: AWSDate
    # bornOnOrBefore: AWSDate
}

type Child @firestore(name:"children", type: INDEXED_BY_TENANT, readPermission:"child:read", writePermission:"child:write", allowUpdate: true, allowDelete: true) {
    id: ID!
    tenant: Tenant!

    firstName: String!
    lastName: String!
    address: Address
    phone: [PhoneContact]
    email: [String]
    gender: String
    # contactPeople: [ChildContactPersonRelation]
    # birthDate: AWSDate
    remarks: String
    managedByParents: [String]
    uitpasNumber: String
    #attendances: [ChildAttendance]
}

type Child @firestore(name:"child-registration-waiting-list", type: INDEXED_BY_TENANT, readPermission:"child:read", writePermission:"child:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type Consumable @firestore(name:"consumables", type:DOC_PER_TENANT, readPermission:"consumables:read", writePermission:"consumables:write") {
    id: ID!
    tenant: Tenant!

    name: String!
    price: Int!
}


type Bubble @firestore(name:"bubbles", type:DOC_PER_TENANT, readPermission:"tenant:read", writePermission:"tenant:write") {
    id: ID!
    tenant: Tenant!
}

type Consumption @firestore(name:"consumptions", type:INDEXED_BY_TENANT, readPermission:"consumption:read", writePermission:"consumption:write", allowUpdate: true, allowDelete: true) {
    id: ID!
    tenant: Tenant!

    child: Child!
    dayId: String! #AWSDate!
    consumable: Consumable!
    pricePaid: Int!
}

type ContactPerson @firestore(name:"contact-people", type:INDEXED_BY_TENANT, readPermission:"contact-person:read", writePermission:"contact-person:write", allowUpdate: true, allowDelete: true) {
    id: ID!
    tenant: Tenant!

    firstName: String!
    lastName: String!
    address: Address
    phone: [PhoneContact]
    email: [String]
    remarks: String
}

type CrewCertificates {
    hasPlayworkerCertificate: Boolean
    hasTeamleaderCertificate: Boolean
    hasTrainerCertificate: Boolean
}

type CrewMember @firestore(name:"crew-members", type:INDEXED_BY_TENANT, readPermission:"crew-member:read", writePermission:"crew-member:write", allowUpdate: true, allowDelete: true) {
    id: ID!
    tenant: Tenant!

    firstName: String!
    lastName: String!
    address: Address
    active: Boolean
    bankAccount: String
    phone: [PhoneContact]
    email: [String]
    yearStarted: Int
    # birthDate: AWSDate
    certificates: CrewCertificates
    remarks: String
    # attendances: [CrewMemberAttendance]
}

type Day {
    id: ID!
    shifts: [Shift]
    # uniqueAttendances: Int
    consumptions: [Consumption]
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
    tenant: Tenant!

    # day: Day!
    # price: Price!
    childrenCanBePresent: Boolean!
    crewCanBePresent: Boolean!
    kind: String!
    location: String
    description: String
    # startAndEnd: StartAndEnd
    # childAttendances: [ChildAttendance]
    # crewMemberAttendances: [CrewMemberAttendance]
}

type Template @firestore(name:"templates", type:INDEXED_BY_TENANT, readPermission:"template:read", writePermission:"template:write", allowUpdate: true, allowDelete: true) {
    id: ID!
}

type ChildAttendance { # TODO where does this fit in? Guess ChildAttendanceBy* refer to it
    child: Child!
    shift: Shift!
    didAttend: Boolean!
    enrolled: String #Timestamp
    enrolledRegisteredBy: String
    arrived: String #Timestamp
    arrivedRegisteredBy: String
    left: String #Timestamp
    leftRegisteredBy: String
    ageGroup: AgeGroup
    amountPaid: Int
    discounts: [String]
}

type CrewMemberAttendance { # TODO where does this fit in?
    id: ID!
    tenant: Tenant!
    crewMember: CrewMember!
    shift: Shift!
    didAttend: Boolean!
    enrolled: String #Timestamp
    ageGroup: AgeGroup
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

type Tenant @firestore(name:"tenants", type:DOC_PER_TENANT, readPermission:"TODO:read", writePermission:"TODO:write", allowUpdate: false, allowDelete: false) {
    id: ID!
    name: String

    address: TenantAddress
    description: String
    contactPerson: TenantContactPerson
    email: String
    logoUrl: String
    logoSmallUrl: String
    privacyPolicyUrl: String

    children: [Child!]!
    child(id: ID!): Child
    contactPeople: [ContactPerson!]!
    #contactPerson(id: ID!): ContactPerson
    crewMembers: [CrewMember!]!
    crewMember(id: ID!): CrewMember
    shifts: [Shift!]!
    shift(id: ID!): Shift

    members: [User!]!
    possibleMembers: [User!]!
}


type Query {
    tenant(tenant: ID!): Tenant
}

schema {
    query: Query
}`
