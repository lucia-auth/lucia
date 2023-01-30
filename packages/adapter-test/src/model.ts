import crypto from "crypto";
import type { KeySchema, SessionSchema, UserSchema } from "lucia-auth";
import { UserSchemaWithAttributes } from "./types";

const generateRandomString = (bytes: number) => {
	return crypto.randomBytes(bytes).toString("hex");
};

export class User {
	public id: string;
	public username: string;
	constructor() {
		this.id = generateRandomString(4);
		this.username = `user${this.id}`;
	}
	public getSchema = (): UserSchemaWithAttributes => {
		return {
			id: this.id,
			username: this.username
		} as const;
	};
	public validateSchema = (row: UserSchema) => {
		if (row.id === this.id && row.username === this.username) return true;
		return false;
	};
	public update = (fields: Partial<UserSchema>) => {
		if (fields.id !== undefined) this.id = fields.id;
		if (fields.username !== undefined) this.username = fields.username;
	};
	public createSession = () => {
		const userId = this.id;
		class Session {
			public userId = userId;
			public id = `at_${generateRandomString(20)}`;
			public activePeriodExpires = new Date().getTime() + 1000 * 60 * 60 * 8;
			public idlePeriodExpires = this.activePeriodExpires + 1000 * 60 * 60 * 24;
			public getSchema = (): SessionSchema => {
				return {
					user_id: this.userId,
					id: this.id,
					idle_expires: this.idlePeriodExpires,
					active_expires: this.activePeriodExpires
				};
			};
			public validateSchema = (row: SessionSchema) => {
				if (
					row.user_id === this.userId &&
					row.id === this.id &&
					row.active_expires === this.activePeriodExpires &&
					row.idle_expires === this.idlePeriodExpires
				)
					return true;
				return false;
			};
		}
		return new Session();
	};
	public createKey = (isPasswordNull: boolean, isPrimary: boolean) => {
		const hashedPassword = isPasswordNull ? null : "HASHED";
		const id = `test:user${generateRandomString(8)}@example.com`;
		const userId = this.id;
		class Key {
			public userId = userId;
			public id = id;
			public isPrimary = isPrimary;
			public hashedPassword = hashedPassword;
			public getSchema = (): KeySchema => {
				return {
					id: this.id,
					user_id: this.userId,
					primary: this.isPrimary,
					hashed_password: hashedPassword
				};
			};
			public validateSchema = (row: KeySchema) => {
				if (
					row.user_id === this.userId &&
					row.id === this.id &&
					row.primary === this.isPrimary &&
					row.hashed_password === this.hashedPassword
				)
					return true;
				return false;
			};
			public updateHashedPassword = (hashedPassword: string | null) => {
				this.hashedPassword = hashedPassword;
			};
		}
		return new Key();
	};
}
