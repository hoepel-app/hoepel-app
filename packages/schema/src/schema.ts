import { GraphQLSchema, buildSchema } from "graphql";
import { readFileSync } from "fs"
import { join } from "path"

export const schema: GraphQLSchema = buildSchema(readFileSync(join(__dirname, '../schema.graphql')).toString())

schema.
