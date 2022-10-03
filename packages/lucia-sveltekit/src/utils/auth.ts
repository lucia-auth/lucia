import { DatabaseUser, User } from "../types.js";

export const getAccountFromDatabaseUser = (databaseData: DatabaseUser) => {
    const {
        id: userId,
        hashedPassword,
        providerId,
        ...userData
    } = databaseData;
    const user = {
        userId,
        ...userData,
    } as User;
    return {
        user,
        hashedPassword: hashedPassword,
        providerId: providerId,
    };
};