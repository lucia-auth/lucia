import { DatabaseUser, LuciaUser } from "../types.js";
export declare const generateAccessToken: (user: LuciaUser, fingerprint: string, secret: string) => Promise<{
    value: string;
    cookie: string;
}>;
export declare const getUserFromAccessToken: (accessToken: string, fingerprint: string, secret: string) => Promise<LuciaUser>;
export declare const generateRefreshToken: (fingerprint: string) => Promise<{
    cookie: string;
    value: string;
}>;
export declare const generateFingerprint: () => {
    value: string;
    cookie: string;
};
export declare const validateRefreshTokenFingerprint: (refreshToken: string, fingerprint: string) => Promise<boolean>;
export declare const createBlankCookies: () => string[];
export declare const getAccountFromDatabaseData: (databaseData: DatabaseUser) => {
    user: LuciaUser;
    hashed_password: string | null;
    identifier_token: string;
};
