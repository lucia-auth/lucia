import { Error, adapterGetUpdateData } from 'lucia-sveltekit';
import type { Adapter, DatabaseUser } from 'lucia-sveltekit/dist/types';
import type { MangoQuery, MangoResponse, ServerScope } from 'nano';

const adapter = (couch: ServerScope): Adapter => {
    return {
        getUserByRefreshToken: async (refreshToken: string) => {
            try {
                await setUpDatabase(couch);
                // get refresh token document
                const tokenQuery: MangoQuery = {
                    selector: {
                        refresh_token: refreshToken
                    }
                };
                const tokenDoc = await getDocumentFromDb('refresh_token', tokenQuery, couch);
                if (!tokenDoc) return null;

                // get user document
                const userQuery: MangoQuery = {
                    selector: {
                        // @ts-ignore
                        _id: tokenDoc.docs.user_id
                    }
                };
                const userDoc = await getDocumentFromDb('user', userQuery, couch);
                if (!userDoc.docs[0]) return null;
                const dbUser = transformUserDocument(userDoc.docs[0]) as DatabaseUser<Record<string, any>>;
                return dbUser;
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_FETCH_FAILED');
            }
        },
        getUserByIdentifierToken: async (identifierToken: string) => {
            try {
                await setUpDatabase(couch);

                const userQuery: MangoQuery = {
                    selector: {
                        identifier_token: identifierToken
                    }
                };
                const user: MangoResponse<any> = await getDocumentFromDb('user', userQuery, couch);
                if (!user.docs[0]) return null;
                const dbUser = transformUserDocument(user.docs[0]) as DatabaseUser<Record<string, any>>;
                return dbUser;
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_FETCH_FAILED');
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
                await setUpDatabase(couch);
                const userDB = couch.use('user');
                const userDoc = {
                    _id: userId,
                    hashed_password: data.hashed_password,
                    identifier_token: data.identifier_token,
                    ...data.user_data
                };

                let err = await validateUserDocument(couch, userDoc);
                if (err != '') {
                    throw new EvalError(err);
                }

                await userDB.insert(userDoc);
                return;
            } catch (error: any) {
                if (error.message.includes('identifier_token')) {
                    throw new Error('AUTH_DUPLICATE_IDENTIFIER_TOKEN');
                }
                if (error.message.includes('email')) {
                    throw new Error('AUTH_DUPLICATE_USER_DATA');
                }
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            try {
                const userQuery = {
                    selector: {
                        _id: userId
                    }
                };
                const user = (await getDocumentFromDb('user', userQuery, couch)).docs[0];
                if (!user) throw new Error('DATABASE_UPDATE_FAILED');
                await couch.use('user').destroy(user._id, user._rev);
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_UPDATE_FAILED');
            }
        },
        setRefreshToken: async (refreshToken: string, userId: string) => {
            try {
                const refreshTokenDoc = {
                    refresh_token: refreshToken,
                    user_id: userId
                };
                const refreshTokenDb = couch.use('refresh_token');
                // @ts-ignore - type definition assumes a _id, but it is not required
                await refreshTokenDb.insert(refreshTokenDoc);
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_UPDATE_FAILED');
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            try {
                const refreshTokenQuery = {
                    selector: {
                        refresh_token: refreshToken
                    }
                };
                const refreshTokenDoc = (await getDocumentFromDb('refresh_token', refreshTokenQuery, couch))
                    .docs[0] as Record<string, any> | null;
                if (!refreshTokenDoc) throw new Error('DATABASE_UPDATE_FAILED');
                await couch.use('refresh_token').destroy(refreshTokenDoc._id, refreshTokenDoc._rev);
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_UPDATE_FAILED');
            }
        },
        deleteUserRefreshTokens: async (userId: string) => {
            try {
                const refreshTokenQuery = {
                    selector: {
                        user_id: userId
                    }
                };
                const refreshTokens = (await getDocumentFromDb('refresh_token', refreshTokenQuery, couch))
                    .docs;
                for (const refreshToken of refreshTokens) {
                    await couch.use('refresh_token').destroy(refreshToken._id, refreshToken._rev);
                }
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_UPDATE_FAILED');
            }
        },
        getUserById: async (userId: string) => {
            try {
                const userQuery = {
                    selector: {
                        _id: userId
                    }
                };
                const user = await getDocumentFromDb('user', userQuery, couch);
                if (user.docs[0] === undefined) return null;
                const dbUser = transformUserDocument(user.docs[0]) as DatabaseUser<Record<string, any>>;
                return dbUser;
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_FETCH_FAILED');
            }
        },
        updateUser: async (userId: string, newData: any) => {
            await setUpDatabase(couch);

            const partialData = adapterGetUpdateData(newData);
            let userDoc: DatabaseUser<Record<string, any>>;
            try {
                const userQuery = {
                    selector: {
                        _id: userId
                    }
                };
                userDoc = (await getDocumentFromDb('user', userQuery, couch)).docs[0] as DatabaseUser<Record<string, any>>;
                const newDoc = {
                    ...userDoc,
                    ...partialData
                }
                const db = couch.use('user');
                // @ts-ignore
                await db.insert(newDoc);
            } catch (error) {
                console.error(error);
                throw new Error('DATABASE_UPDATE_FAILED');
            }
            if (!userDoc) throw new Error('AUTH_INVALID_USER_ID');
            return transformUserDocument(userDoc) as DatabaseUser<Record<string, any>>;
        }
    };
};

const getDocumentFromDb = async (
    dbName: string,
    query: MangoQuery,
    couch: ServerScope
): Promise<MangoResponse<any>> => {
    const db = couch.use(dbName);
    const res = await db.find(query);
    return res;
};

export const transformUserDocument = (doc: Record<string, any>): Record<string, any> => {
    let id = doc._id;
    delete doc._id;
    delete doc._rev;
    return {
        id,
        ...doc
    };
};

export const setUpDatabase = async (couch: ServerScope) => {
    // check if databases exist
    const databases = await couch.db.list();
    if (
        !databases.includes('user')
    ) {
        await setUpUserDB(couch);
    }
    if (
        !databases.includes('refresh_token')
    ) {
        await setUpRefreshTokenDB(couch);
    }
};

const setUpUserDB = async (couch: ServerScope) => {
    try {
        await couch.db.create('user');
        let db = couch.use('user');
        await db.createIndex({
            index: { fields: ['identifier_token'] },
            name: 'identifier_token_index'
        });
        let view = {
            _id: '_design/userView',
            views: {
                'user-view': {
                    map: 'function (doc) {\n  emit(\"email\", doc.email);\n  emit(\"identifier_token\", doc.identifier_token);\n}'
                }
            },
            language: 'javascript'
        };
        await db.insert(view);
    } catch (error) {
        // db already exists - do nothing
    }
};

const validateUserDocument = async (couch: ServerScope, doc: any): Promise<string> => {
    let body = await couch.db.use('user').view('userView', 'user-view');

    let identifier = body.rows.find((elem: any) => {
        if (elem.key == 'identifier_token' && elem.value == doc.identifier_token) {
            return elem;
        }
    })

    let mail = body.rows.find((elem: any) => {
        if (elem.key == 'email' && elem.value == doc.email) {
            return elem;
        }
    })

    let err = '';
    if (identifier) {
        err += 'identifier_token '
    }

    if (mail) {
        err += 'email'
    }
    return err;
}

const setUpRefreshTokenDB = async (couch: ServerScope) => {
    try {
        await couch.db.create('refresh_token');
        let db = couch.use('refresh_token');
        await db.createIndex({
            index: { fields: ['refresh_token'] },
            name: 'refresh_token_index'
        });
        await db.createIndex({
            index: { fields: ['user_id'] },
            name: 'user_id_index'
        });
    } catch (error) {
        // db already exists - do nothing
    }
};

export default adapter;
