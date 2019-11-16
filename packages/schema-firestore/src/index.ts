import {schema} from '@hoepel.app/schema'
import { GraphQLSchema, buildSchema } from 'graphql'

export const graphqlSchema: GraphQLSchema = buildSchema(schema)
