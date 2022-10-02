import { DatabaseUser, User } from "../types.js";

export const getAccountFromDatabaseData = (databaseData: DatabaseUser) => {
    const {
        id: userId,
        hashedPassword,
        identifierToken,
        ...userData
    } = databaseData;
    const user = {
        userId,
        ...userData,
    } as User;
    return {
        user,
        hashedPassword: hashedPassword,
        identifierToken: identifierToken,
    };
};