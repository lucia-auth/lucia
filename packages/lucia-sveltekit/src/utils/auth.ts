import { UserSchema, User } from "../types.js";

export const getAccountFromDatabaseUser = (databaseData: UserSchema) => {
    const {
        id: userId,
        hashed_password: hashedPassword,
        provider_id: providerId,
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
