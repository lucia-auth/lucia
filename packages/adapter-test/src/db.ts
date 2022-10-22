import crypto from "crypto";
import type { SessionSchema, UserSchema } from "lucia-sveltekit/types";

const generateRandomString = (bytes: number) => {
    return crypto.randomBytes(bytes).toString("hex");
};

export class User {
    public id: string;
    public providerId: string;
    public hashedPassword: string | null;
    public username: string;
    constructor(nullPassword = false) {
        this.id = generateRandomString(4);
        this.hashedPassword = nullPassword ? null : "HASHED";
        this.providerId = `test:user${this.id}@example.com`;
        this.username = `user${this.id}`;
    }
    public getSchema = (): UserSchema => {
        return {
            id: this.id,
            provider_id: this.providerId,
            hashed_password: this.hashedPassword,
            username: this.username,
        } as const;
    };
    public validateSchema = (row: UserSchema) => {
        if (
            row.id === this.id &&
            row.provider_id === this.providerId &&
            row.hashed_password === this.hashedPassword &&
            row.username === this.username
        )
            return true;
        return false;
    };
    public update = (fields: Partial<UserSchema>) => {
        if (fields.hashed_password !== undefined)
            this.hashedPassword = fields.hashed_password;
        if (fields.id !== undefined) this.id = fields.id;
        if (fields.provider_id !== undefined)
            this.providerId = fields.provider_id;
        if (fields.username !== undefined) this.username = fields.username;
    };
    public createSession = () => {
        const userId = this.id;
        class Session {
            public userId = userId;
            public id = `at_${generateRandomString(20)}`;
            public expires = new Date().getTime() + 1000 * 60 * 60 * 8;
            public idlePeriodExpires = this.expires + 1000 * 60 * 60 * 24;
            public getSchema = (): SessionSchema => {
                return {
                    user_id: this.userId,
                    id: this.id,
                    idle_expires: this.idlePeriodExpires,
                    expires: this.expires,
                };
            };
            public validateSchema = (row: SessionSchema) => {
                if (
                    row.user_id === this.userId &&
                    row.id === this.id &&
                    row.expires === this.expires &&
                    row.idle_expires === this.idlePeriodExpires
                )
                    return true;
                return false;
            };
        }
        return new Session();
    };
}
