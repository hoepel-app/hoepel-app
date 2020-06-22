import { gql } from 'apollo-server-express'

export const typeDef = gql`
  input ChildManagedByParentAddressInput {
    street: String
    number: String
    zipCode: Int
    city: String
  }

  input ChildManagedByParentPhoneContactInput {
    phoneNumber: String!
    comment: String
  }

  input ChildManagedByParentInput {
    firstName: String!
    lastName: String!
    address: ChildManagedByParentAddressInput!
    phone: [ChildManagedByParentPhoneContactInput!]!
    email: [String!]!
    gender: String
    birthDate: DayDate
    remarks: String!
    uitpasNumber: String
  }

  type ChildManagedByParent {
    id: String!
    firstName: String!
    lastName: String!
    onRegistrationWaitingList: Boolean!
  }

  type ShiftChildCanAttend {
    id: ID!
    date: DayDate!
    description: String!
    location: String!
    start: DateTime!
    end: DateTime!
    durationFormatted: String!
    kind: String!
    price: String!
  }

  type DayWithShiftsChildrenCanAttend {
    day: DayDate!
    dayFormatted: String!
    shifts: [ShiftChildCanAttend!]!
  }

  type SelectableBubbleForWeek {
    name: String!
    spotsLeft: Int
    totalSpots: Int!
  }

  enum ChildAttendanceIntentionStatus {
    pending
    rejected
    accepted
    child_on_registration_waiting_list
  }

  type ChildAttendanceIntentionForWeek {
    weekNumber: Int!
    year: Int!
    childId: ID!
    status: ChildAttendanceIntentionStatus!
    preferredBubbleName: String
    assignedBubbleName: String
    shifts: [ShiftChildCanAttend!]!
  }

  type ShiftsGroupedByWeek {
    weekNumber: Int!
    year: Int!
    weekDescription: String!
    possibleBubbles: [SelectableBubbleForWeek!]!
    days: [DayWithShiftsChildrenCanAttend!]!
    attendanceIntentionsForChild(childId: ID!): ChildAttendanceIntentionForWeek
    organisationId: String!
  }

  type ParentPlatform {
    childrenManagedByMe: [ChildManagedByParent!]!
    shiftsAvailable(year: Int!): [ShiftsGroupedByWeek!]!
  }

  extend type Query {
    parentPlatform(organisationId: ID!): ParentPlatform!
  }

  extend type Mutation {
    registerChildFromParentPlatform(
      organisationId: ID!
      newChild: ChildManagedByParentInput
    ): String

    registerChildAttendanceIntentionFromParentPlatform(
      organisationId: ID!
      childId: ID!
      preferredBubbleName: String
      weekNumber: Int!
      year: Int!
      shifts: [ID!]!
    ): String

    unregisterPendingChildAttendanceIntentionFromParentPlatform(
      organisationId: ID!
      childId: ID!
      weekNumber: Int!
      year: Int!
    ): String
  }
`
