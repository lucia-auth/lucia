export const getUpdateData = (data: {
    identifier_token?: string | null;
    hashed_password?: string | null;
    user_data?: Record<string, any>;
}) => {
    const rawData: Record<string, any> = {
        identifer_token: data.identifier_token,
        hashed_password: data.hashed_password,
        ...data.user_data,
    };
    const result: Record<string, any> = {};
    for (const key in rawData) {
        if (rawData[key] === undefined) continue;
        result[key] = rawData[key];
    }
    return result;
};
