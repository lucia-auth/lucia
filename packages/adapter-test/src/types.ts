import { UserSchema } from "lucia-auth"

export type UserSchemaWithAttributes = UserSchema & {
	username: string
}