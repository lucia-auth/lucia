import {
    Client,
    Databases,
    Models,
    Query,
    AppwriteException, 
} from "node-appwrite";
import { Error, adapterGetUpdateData } from "lucia-sveltekit";
import type { Adapter } from "lucia-sveltekit/dist/types";

export const transformUserDoc = (doc: { $id: string; [data: string]: any }) => {
    const docCopy = structuredClone(doc);
    const appWriteKeys = [
        "$read",
        "$write",
        "$id",
        "$createdAt",
        "$updatedAt",
        "$collection",
    ];
    const id = docCopy.$id;
    for (const keys in docCopy) {
        if (appWriteKeys.includes(keys)) {
            delete docCopy[keys];
        }
    }
    return {
        id,
        ...docCopy,
    };
};

interface AppWriteError {
    code: number,
    type: string,
    response: any
}

const adapter = (config: {
    project_id: string;
    api: {
        key: string;
        endpoint: string;
    };
    database: {
        id: string;
        user_collection_id: string;
        refresh_token_collection_id: string;
    };
}): Adapter => {
    const client = new Client();
    client
        .setEndpoint(config.api.endpoint)
        .setProject(config.project_id)
        .setKey(config.api.key);
    const db = new Databases(client, config.database.id);
    const userCollectionId = config.database.user_collection_id;
    const refreshTokenCollectionId = config.database.refresh_token_collection_id;
    return {
        getUserByRefreshToken: async (refreshToken: string) => {
            try {
                const refreshTokenDocs = await db.listDocuments(
                    refreshTokenCollectionId,
                    [Query.equal("refresh_token", refreshToken)],
                    1
                );
                const refreshTokenDoc = refreshTokenDocs.documents[0] as Models.Document & Record<string, any>;
                if (!refreshTokenDoc) return null;
                const userDoc = await db.getDocument(
                    userCollectionId,
                    refreshTokenDoc.user_id
                );
                return transformUserDoc(userDoc) as any;
            } catch (e) {
                const error = e as AppwriteException;
                if (error.code === 404) return null; // document not found
                console.error(error);
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        getUserByIdentifierToken: async (identifierToken: string) => {
            try {
                const userDocs = await db.listDocuments(
                    userCollectionId,
                    [Query.equal("identifier_token", identifierToken)],
                    1
                );
                return userDocs.documents[0]
                    ? (transformUserDoc(userDocs.documents[0] as any) as any)
                    : null;
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        getUserById: async (userId: string) => {
            try {
                const userDoc = await db.getDocument(userCollectionId, userId);
                return transformUserDoc(userDoc) as any;
            } catch (e) {
                const error = e as AppWriteError;
                if (error.type === "document_not_found") return null; // document not found
                console.error(e);
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        setUser: async (
            userId: string,
            data: {
                hashed_password: string | null;
                identifier_token: string;
                user_data: Record<string, any>;
            }
        ) => {
            try {
                await db.createDocument(userCollectionId, userId, {
                    identifier_token: data.identifier_token,
                    hashed_password: data.hashed_password,
                    ...data.user_data,
                });
            } catch (e) {
                const error = e as AppWriteError;
                if (error.type === "document_already_exists") throw new Error("AUTH_DUPLICATE_USER_DATA")
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            try {
                await db.deleteDocument(userCollectionId, userId);
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        setRefreshToken: async (refreshToken: string, userId: string) => {
            try {
                await db.createDocument(refreshTokenCollectionId, "unique()", {
                    refresh_token: refreshToken,
                    user_id: userId,
                });
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            try {
                const refreshTokenDocs = await db.listDocuments(
                    refreshTokenCollectionId,
                    [Query.equal("refresh_token", refreshToken)]
                );
                const promises: Promise<Response>[] = [];
                refreshTokenDocs.documents.forEach((val) => {
                    promises.push(
                        db.deleteDocument(refreshTokenCollectionId, val.$id)
                    );
                });
                await Promise.all(promises);
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUserRefreshTokens: async (userId: string) => {
            try {
                const refreshTokenDocs = await db.listDocuments(
                    refreshTokenCollectionId,
                    [Query.equal("user_id", userId)]
                );
                const promises: Promise<Response>[] = [];
                refreshTokenDocs.documents.forEach((val) => {
                    promises.push(
                        db.deleteDocument(refreshTokenCollectionId, val.$id)
                    );
                });
                await Promise.all(promises);
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        updateUser: async (userId, newData) => {
            const dbData = adapterGetUpdateData(newData);
            try {
                const userDoc = await db.updateDocument(
                    userCollectionId,
                    userId,
                    dbData
                );
                return transformUserDoc(userDoc) as any;
            } catch (e) {
                const error = e as AppWriteError;
                if (error.type === "document_not_found") throw new Error("AUTH_INVALID_USER_ID")
                console.error(error);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
    };
};

export default adapter;
