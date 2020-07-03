import { gql } from 'apollo-server-express'

export const typeDef = gql`
  type TestTemplateOutput {
    path: String
  }

  extend type Mutation {
    acceptPrivacyPolicy: Void
    acceptTermsAndConditions: Void
    changeDisplayName(name: String!): Void

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

    throwTestException: Void
  }
`
