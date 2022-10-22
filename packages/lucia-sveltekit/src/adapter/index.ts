import { UserSchema } from "../types.js";

export const getUpdateData = (data: {
    providerId?: string | null;
    hashedPassword?: string | null;
    attributes?: Record<string, any>;
}): Partial<UserSchema> => {
    const rawData: Record<string, any> = {
        provider_id: data.providerId,
        hashed_password: data.hashedPassword,
        ...(data.attributes || {}),
    };
    const result: Record<string, any> = {};
    for (const key in rawData) {
        if (rawData[key] === undefined) continue;
        result[key] = rawData[key];
    }
    return result;
};
