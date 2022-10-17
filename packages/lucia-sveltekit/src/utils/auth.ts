import { UserSchema } from "../adapter/index.js";
import { User } from "../types.js";

export const getAccountFromDatabaseUser = (databaseData: UserSchema) => {
    const {
        id: userId,
        hashed_password: hashedPassword,
        provider_id: providerId,
        ...userData
    } = databaseData;
    const user: User = {
        userId,
        ...userData,
    };
    return {
        user,
        hashedPassword: hashedPassword,
        providerId: providerId,
    };
};
