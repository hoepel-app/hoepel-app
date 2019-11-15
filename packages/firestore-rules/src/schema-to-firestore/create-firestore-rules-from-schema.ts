import { GraphQLSchema } from "graphql";
import { Rule } from "../firestore/rule";
import { getFirestoreCollectionsFromSchema } from "./get-firestore-collections-from-schema";

export const createFirestoreRulesFromSchema = (schema: GraphQLSchema, extraRules: readonly Rule[] = []): string => {
    const rulesFromSchemaAsText = getFirestoreCollectionsFromSchema(schema)
        .map(collection => collection.firestoreRules)
        .map(rules => rules.map(rule => rule.toString()).join('\n\n'))
        .join('\n\n');

    const extraRulesText = extraRules.map(rule => rule.toString()).join('\n\n')

    return [
        'service cloud.firestore {',
        indent('/// Extra rules provided for generation'),
        indent(extraRulesText),
        indent('/// Automaticaly generated Firestore rules'),
        indent(rulesFromSchemaAsText),
        '}'
    ].join('\n\n')
}

const indent = (str: string, indentation = '  '): string => str
    .split('\n')
    .map(line => indentation + line)
    .join('\n')
