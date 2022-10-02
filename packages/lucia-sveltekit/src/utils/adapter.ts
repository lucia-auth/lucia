export const getUpdateData = (data: {
    identifierToken?: string | null;
    hashedPassword?: string | null;
    userData?: Record<string, any>;
}) => {
    const rawData: Record<string, any> = {
        identifier_token: data.identifierToken,
        hashed_password: data.hashedPassword,
        ...data.userData,
    };
    const result: Record<string, any> = {};
    for (const key in rawData) {
        if (rawData[key] === undefined) continue;
        result[key] = rawData[key];
    }
    return result;
};
