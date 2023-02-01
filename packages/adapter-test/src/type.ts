import { UserSchema } from "lucia-auth";

export type TestUserSchema = UserSchema & {
	username: string;
};
