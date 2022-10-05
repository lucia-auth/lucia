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
    public email: string;
    constructor(nullPassword = false) {
        this.id = generateRandomString(4);
        this.email = `user${this.id}@example.com`;
        this.hashedPassword = nullPassword ? null : "HASHED";
        this.providerId = `test:user${this.id}@example.com`;
        this.username = `user${this.id}`;
    }
    public getDbSchema = (): UserRow => {
        return {
            id: this.id,
            provider_id: this.providerId,
            hashed_password: this.hashedPassword,
            username: this.username,
            email: this.email,
        } as const;
    };
    public getSchema = (): UserSchema => {
        return {
            id: this.id,
            email: this.email,
            hashedPassword: this.hashedPassword,
            providerId: this.providerId,
            username: this.username
        }
    }
    public validateDbSchema = (row: UserRow) => {
        if (
            row.id === this.id &&
            row.provider_id === this.providerId &&
            row.hashed_password === this.hashedPassword &&
            row.username === this.username &&
            row.email === this.email
        )
            return true;
        return false;
    };
    public validateSchema = (row: UserSchema) => {
        if (
            row.id === this.id &&
            row.providerId === this.providerId &&
            row.hashedPassword === this.hashedPassword &&
            row.username === this.username &&
            row.email === this.email
        )
            return true;
        return false;
    };
    public update = (fields: Partial<UserSchema>) => {
        if (fields.email !== undefined) this.email = fields.email
        if (fields.hashedPassword !== undefined) this.hashedPassword = fields.hashedPassword
        if (fields.id !== undefined) this.id = fields.id
        if (fields.providerId !== undefined) this.providerId = fields.providerId
        if (fields.username !== undefined) this.username = fields.username 
    }
    public createRefreshToken = () => {
        const userId = this.id;
        class RefreshToken {
            public userId = userId;
            public refreshToken = `rt_${generateRandomString(20)}`;
            public getDbSchema = (): RefreshTokenRow => {
                return {
                    user_id: this.userId,
                    refresh_token: this.refreshToken,
                } as const;
            };
            public getSchema = () => {
                return {
                    refreshToken: this.refreshToken,
                    userId: this.userId
                } as const
            }
            public validateDbSchema = (row: RefreshTokenRow) => {
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
            public getDbSchema = (): SessionRow => {
                return {
                    user_id: this.userId,
                    access_token: this.accessToken,
                    expires: this.expires,
                } as const;
            };
            public getSchema = (): SessionSchema => {
                return {
                    userId: this.userId,
                    accessToken: this.accessToken,
                    expires: this.expires
                }
            }
            public validateDbSchema = (row: SessionRow) => {
                if (
                    row.user_id === this.userId &&
                    row.access_token === this.accessToken &&
                    row.expires === this.expires
                )
                    return true;
                return false;
            };
            public validateSchema = (row: SessionSchema) => {
                if (
                    row.userId === this.userId &&
                    row.accessToken === this.accessToken &&
                    row.expires === this.expires
                )
                    return true;
                return false;
            };
        }
        return new Session();
    };
}