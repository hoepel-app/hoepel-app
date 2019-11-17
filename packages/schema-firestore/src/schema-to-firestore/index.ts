import { DocumentNode, visit, ObjectTypeDefinitionNode, DirectiveNode, TypeDefinitionNode } from 'graphql';
import { Collection } from '../firestore/collection';
import { IndexedByTenantCollection } from '../firestore/indexed-by-tenant-collection';
import { DocPerTenantCollection } from '../firestore/doc-per-tenant-collection';
import { DocPerUserCollection } from '../firestore/doc-per-user-collection';

type CollectionType = 'INDEXED_BY_TENANT' | 'DOC_PER_TENANT' | 'DOC_PER_USER'

type CollectionDetails = {
    name: string;
    readPermission: string | null;
    writePermission: string | null;
    allowDelete: boolean | null;
    allowUpdate: boolean | null;
    allowPublicRead: boolean | null;
    type: CollectionType | null;
}


export const getFirestoreCollections = (schema: DocumentNode): readonly Collection[] =>
    visit(schema, {
        leave: {
            ObjectTypeDefinition: visitObjectTypeDefinition,
        },
    }).definitions.filter((el: Collection | TypeDefinitionNode) => el instanceof Collection);

const visitObjectTypeDefinition = (node: ObjectTypeDefinitionNode): Collection | null => {
    const directiveVisitResult = visit(node, {
        leave: {
            Directive: visitObjectTypeDirective
        }
    })

    const collectionDetails = directiveVisitResult?.directives?.filter((el: CollectionDetails | null) => el != null)?.[0]

    if (collectionDetails == null) {
        return null
    }

    return collectionDetailsToCollection(collectionDetails)
}

const visitObjectTypeDirective = (node: DirectiveNode): CollectionDetails | null => {
    if (node.name.value === 'firestore') {
        const name = getArgumentAsStringValue(node, 'name')
        const readPermission = getArgumentAsStringValue(node, 'readPermission')
        const writePermission = getArgumentAsStringValue(node, 'writePermission')

        const allowDelete = getArgumentAsBooleanValue(node, 'allowDelete')
        const allowUpdate = getArgumentAsBooleanValue(node, 'allowUpdate')
        const allowPublicRead = getArgumentAsBooleanValue(node, 'allowPublicRead')

        const type = getCollectionType(node)

        if (type === null || name === null) {
            throw new Error('type is null or name is null - this should not be possible (non-null in schema)')
        }

        return {
            name,
            readPermission,
            writePermission,
            allowDelete,
            allowUpdate,
            allowPublicRead,
            type,
        }
    }

    return null
}

const collectionDetailsToCollection = (details: CollectionDetails): Collection => {
    switch (details.type) {
        case 'INDEXED_BY_TENANT':
            return new IndexedByTenantCollection(details.name, {
                readPermission: details.readPermission,
                writePermission: details.writePermission,
                updatePermission: details.allowUpdate ? details.writePermission : null,
                deletePermission: details.allowDelete ? details.writePermission : null,
            }, details.allowPublicRead || false)

        case 'DOC_PER_TENANT':
            if (details.readPermission == null || details.writePermission == null) {
                throw new Error('For a DOC_PER_TENANT collection, both readPermission and writePermission need to be set')
            }

            return new DocPerTenantCollection(details.name, {
                readPermission: details.readPermission,
                writePermission: details.writePermission,
            })

        case 'DOC_PER_USER':
            return new DocPerUserCollection(details.name);

        default:
            throw new Error(`Unknown collection type: ${details.type}`)
    }
}

const getCollectionType = (node: DirectiveNode, argName = 'type'): CollectionType => {
    const argument = node.arguments?.find(arg => arg.name.value === argName)?.value

    const isValidCollectionType = (value: string): boolean => [ 'INDEXED_BY_TENANT', 'DOC_PER_TENANT', 'DOC_PER_USER' ].includes(value)

    if (argument?.kind === 'EnumValue' && isValidCollectionType(argument.value)) {
        return argument.value as CollectionType
    } else {
        throw new Error(`Missing or invalid value for Firestore collection type (argument: ${argument})`)
    }
}

const getArgumentAsStringValue = (node: DirectiveNode, argName: string): string  | null => {
    const argument = node.arguments?.find(arg => arg.name.value === argName)?.value

    if (argument?.kind === 'StringValue') {
        return argument.value
    } else {
        return null
    }
}
const getArgumentAsBooleanValue = (node: DirectiveNode, argName: string): boolean  | null => {
    const argument = node.arguments?.find(arg => arg.name.value === argName)?.value

    if (argument?.kind === 'BooleanValue') {
        return argument.value
    } else {
        return null
    }
}
