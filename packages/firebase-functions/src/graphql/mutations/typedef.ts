import { gql } from 'apollo-server-express'

export const typeDef = gql`
  input RequestOrganisationInput {
    test: String!
  }

  type TestTemplateOutput {
    path: String
  }

  extend type Mutation {
    acceptPrivacyPolicy: User
    acceptTermsAndConditions: User
    changeDisplayName(name: String!): User

    deleteReport(tenant: ID!, fileName: String!): Report
    createReport(
      tenant: ID!
      type: ReportType!
      format: ReportFileFormat!
      year: Int
    ): Report!
    createDayOverviewReport(
      tenant: ID!
      format: ReportFileFormat!
      dayId: String!
    ): Report!

    testTemplate(tenant: ID!, templateFileName: String!): TestTemplateOutput!
    fillInTemplate(
      tenant: ID!
      childId: ID!
      templateFileName: String!
      year: Int
    ): Report!
    deleteTemplate(tenant: ID!, templateFileName: String!): Template!

    requestOrganisation(input: RequestOrganisationInput!): String
    removeMemberFromOrganisation(tenant: ID!, uidToRemove: ID!): User!
    addUserToOrganisation(tenant: ID!, uidToAdd: ID!): User! # TODO addUser... => addMember...
    throwTestException: String
  }
`
