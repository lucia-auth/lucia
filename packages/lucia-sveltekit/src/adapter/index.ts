export type UserSchema = {
    id: string;
    hashed_password: string | null;
    provider_id: string;
} & Lucia.UserAttributes;

export type UserData = { id: string } & Required<Lucia.UserAttributes>;

export type SessionSchema = {
    id: string;
    expires: number;
    idle_expires: number;
    user_id: string;
};

export interface Adapter {
    getUser: (userId: string) => Promise<UserSchema | null>;
    getUserByProviderId: (providerId: string) => Promise<UserSchema | null>;
    getSessionAndUserBySessionId: (sessionId: string) => Promise<{
        user: UserSchema;
        session: SessionSchema;
    } | null>;
    setUser: (
        userId: string | null,
        data: {
            providerId: string;
            hashedPassword: string | null;
            attributes: Record<string, any>;
        }
    ) => Promise<UserSchema>;
    deleteUser: (userId: string) => Promise<void>;
    updateUser: (
        userId: string,
        data: {
            providerId?: string | null;
            hashedPassword?: string | null;
            attributes?: Record<string, any>;
        }
    ) => Promise<UserSchema>;
    getSession: (sessionId: string) => Promise<SessionSchema | null>;
    getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
    setSession: (
        sessionId: string,
        data: {
            userId: string;
            expires: number;
            idlePeriodExpires: number;
        }
    ) => Promise<void>;
    deleteSession: (...sessionIds: string[]) => Promise<void>;
    deleteSessionsByUserId: (userId: string) => Promise<void>;
}

export const getUpdateData = (data: {
    providerId?: string | null;
    hashedPassword?: string | null;
    attributes?: Record<string, any>;
}) => {
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
