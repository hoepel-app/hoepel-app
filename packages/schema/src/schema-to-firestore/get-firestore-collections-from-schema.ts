import { DirectiveNode, GraphQLNamedType, GraphQLSchema } from "graphql"
import { Collection } from "../firestore/collection"
import { IndexedByTenantCollection } from "../firestore/indexed-by-tenant-collection"
import { DocPerTenantCollection } from "../firestore/doc-per-tenant-collection"
import { DocPerUserCollection } from "../firestore/doc-per-user-collection"

export const getFirestoreCollectionsFromSchema = (schema: GraphQLSchema): readonly Collection[] => {
    const typeMap = schema.getTypeMap()

    return Object.entries(typeMap)
        .map(( [typeName, graphqlType] ) => {
            if (typeName !== graphqlType.name) {
                throw new Error('Sanity: typeName should always equal GraphQL type name. How did you end up here?')
            }
            
            return graphqlType
        })
        .filter(graphqlType => firestoreCollectionDirective(graphqlType, 'firestore') != null)
        .map(graphqlType => {
            const collectionDirective = firestoreCollectionDirective(graphqlType, 'firestore') as DirectiveNode

            const collectionName = getGraphQLDirectiveStringArgument(collectionDirective, 'name') as string
            const collectionType = getGraphQLDirectiveEnumArgument(collectionDirective, 'type')

            const readPermission = getGraphQLDirectiveStringArgument(collectionDirective, 'readPermission')
            const writePermission = getGraphQLDirectiveStringArgument(collectionDirective, 'writePermission')
            const deletePermission = getGraphQLDirectiveBooleanArgumentWithFallback(collectionDirective, 'allowDelete') ? writePermission : null
            const updatePermission = getGraphQLDirectiveBooleanArgumentWithFallback(collectionDirective, 'allowUpdate') ? writePermission : null

            const allowPublicRead = getGraphQLDirectiveBooleanArgumentWithFallback(collectionDirective, 'allowPublicRead', false)


            if (collectionType === 'INDEXED_BY_TENANT') {
                return new IndexedByTenantCollection(collectionName, {
                    readPermission, writePermission, deletePermission, updatePermission
                }, allowPublicRead)
            } else if (collectionType === 'DOC_PER_TENANT') {
                if (readPermission == null || writePermission == null) {
                    throw new Error(`Neither read nor write permission can be null for a doc per tenant collection. Got: read=${readPermission}, write=${writePermission}`)
                }

                return new DocPerTenantCollection(collectionName, {
                    readPermission,
                    writePermission,
                })
            } else if (collectionType === 'DOC_PER_USER') {
                return new DocPerUserCollection(collectionName)
            } else {
                throw new Error(`Unknown Firestore collection type: ${collectionType}`)
            }
        })
}

const firestoreCollectionDirective = (type: GraphQLNamedType, directiveName: string): DirectiveNode | null => {
    const collectionDirective = type.astNode?.directives?.find(directive => {
        return directive.name.value === directiveName
    })

    return collectionDirective || null
}

const getGraphQLDirectiveStringArgument = (directive: DirectiveNode, argumentName: string): string | null => {
    const node = directive.arguments?.find(arg => arg.name.value === argumentName)?.value

    if (node == null || node?.kind !== 'StringValue') {
        return null
    }

    return node.value
}

const getGraphQLDirectiveEnumArgument = (directive: DirectiveNode, argumentName: string): string | null => {
    const node = directive.arguments?.find(arg => arg.name.value === argumentName)?.value

    if (node == null || node?.kind !== 'EnumValue') {
        return null
    }

    return node.value
}

const getGraphQLDirectiveBooleanArgumentWithFallback = (directive: DirectiveNode, argumentName: string, fallback = false): boolean => {
    const node = directive.arguments?.find(arg => arg.name.value === argumentName)?.value

    if (node == null || node?.kind !== 'BooleanValue') {
        return fallback
    }

    return node.value
}
