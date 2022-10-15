import crypto from "crypto";
import type { SessionSchema, UserSchema } from "lucia-sveltekit/types";
import { RefreshTokenRow, SessionRow, UserRow } from "./types.js";

const generateRandomString = (bytes: number) => {
    return crypto.randomBytes(bytes).toString("hex");
};

export class User {
    public id: string;
    public providerId: string;
    public hashedPassword: string | null;
    public username: string;
    public userEmail: string;
    constructor(nullPassword = false) {
        this.id = generateRandomString(4);
        this.userEmail = `user${this.id}@example.com`;
        this.hashedPassword = nullPassword ? null : "HASHED";
        this.providerId = `test:user${this.id}@example.com`;
        this.username = `user${this.id}`;
    }
    public getSchema = (): UserRow => {
        return {
            id: this.id,
            provider_id: this.providerId,
            hashed_password: this.hashedPassword,
            username: this.username,
            user_email: this.userEmail,
        } as const;
    };
    public validateSchema = (row: UserRow) => {
        if (
            row.id === this.id &&
            row.provider_id === this.providerId &&
            row.hashed_password === this.hashedPassword &&
            row.username === this.username &&
            row.user_email === this.userEmail
        )
            return true;
        return false;
    };
    public update = (fields: Partial<UserSchema>) => {
        if (fields.user_email !== undefined) this.userEmail = fields.user_email
        if (fields.hashed_password !== undefined) this.hashedPassword = fields.hashed_password
        if (fields.id !== undefined) this.id = fields.id
        if (fields.provider_id !== undefined) this.providerId = fields.provider_id
        if (fields.username !== undefined) this.username = fields.username 
    }
    public createRefreshToken = () => {
        const userId = this.id;
        class RefreshToken {
            public userId = userId;
            public refreshToken = `rt_${generateRandomString(20)}`;
            public getSchema = () => {
                return {
                    refresh_token: this.refreshToken,
                    user_id: this.userId
                } as const
            }
            public validateSchema = (row: RefreshTokenRow) => {
                if (
                    row.user_id === this.userId &&
                    row.refresh_token === this.refreshToken
                )
                    return true;
                return false;
            };
        }
        return new RefreshToken();
    };
    public createSession = () => {
        const userId = this.id;
        class Session {
            public userId = userId;
            public accessToken = `at_${generateRandomString(20)}`;
            public expires = new Date().getTime() + 1000 * 60 * 60 * 8;
            public getSchema = (): SessionSchema => {
                return {
                    user_id: this.userId,
                    access_token: this.accessToken,
                    expires: this.expires
                }
            }
            public validateSchema = (row: SessionSchema) => {
                if (
                    row.user_id === this.userId &&
                    row.access_token === this.accessToken &&
                    row.expires === this.expires
                )
                    return true;
                return false;
            };
        }
        return new Session();
    };
}