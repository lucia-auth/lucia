import { Database, testAdapter } from "@lucia-sveltekit/adapter-test";
import { Client, Databases } from "node-appwrite";
import appwrite, { transformUserDoc } from "../src/index.js";

const apiEndpoint = "http://localhost/v1";
const projectId = "";
const apiKey = "";
const databaseId = "";
const userCollectionId = "";
const refreshTokenCollectionId = "";

const client = new Client();
client.setEndpoint(apiEndpoint).setProject(projectId).setKey(apiKey);
const appWriteDb = new Databases(client, databaseId);

const transformRefreshTokenDoc = (doc: {
    $id: string;
    refresh_token: string;
    user_id: string;
}) => {
    return {
        refresh_token: doc.refresh_token,
        user_id: doc.user_id,
    };
};

const db: Database = {
    getUsers: async () => {
        try {
            const userDocs = await appWriteDb.listDocuments(userCollectionId);
            return userDocs.documents.map((doc) =>
                transformUserDoc(doc)
            ) as any[];
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
    getRefreshTokens: async () => {
        try {
            const refreshTokenDocs = await appWriteDb.listDocuments(
                refreshTokenCollectionId
            );
            return refreshTokenDocs.documents.map((doc) =>
                transformRefreshTokenDoc(doc as any)
            ) as any[];
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
    insertUser: async (user) => {
        const userId = user.id;
        const doc: any = { ...user };
        delete doc.id;
        try {
            await appWriteDb.createDocument(userCollectionId, userId, doc);
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
    insertRefreshToken: async (refreshToken) => {
        try {
            await appWriteDb.createDocument(
                refreshTokenCollectionId,
                "unique()",
                refreshToken
            );
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
    clearUsers: async () => {
        try {
            const refreshTokenDocs = await appWriteDb.listDocuments(
                userCollectionId
            );
            const promises: Promise<Response>[] = [];
            refreshTokenDocs.documents.forEach((val) => {
                promises.push(
                    appWriteDb.deleteDocument(userCollectionId, val.$id)
                );
            });
            await Promise.all(promises);
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
    clearRefreshTokens: async () => {
        try {
            const refreshTokenDocs = await appWriteDb.listDocuments(
                refreshTokenCollectionId
            );
            const promises: Promise<Response>[] = [];
            refreshTokenDocs.documents.forEach((val) => {
                promises.push(
                    appWriteDb.deleteDocument(refreshTokenCollectionId, val.$id)
                );
            });
            await Promise.all(promises);
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    },
};

testAdapter(
    appwrite({
        project_id: projectId,
        api: {
            endpoint: apiEndpoint,
            key: apiKey,
        },
        database: {
            id: databaseId,
            user_collection_id: userCollectionId,
            refresh_token_collection_id: refreshTokenCollectionId,
        },
    }),
    db
);
