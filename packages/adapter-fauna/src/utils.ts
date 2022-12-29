import { UserSchema } from "lucia-auth";

export type MultiResponse<T> = {
	data: {
		data: T;
	}[];
};

export type SingleResponse<T> = {
	data: T;
};

export type FaunaUserSchema = {
	id: string;
	hashed_password?: string;
	provider_id: string;
	[k: string]: any;
};

export type FaunaSessionSchema = {
	id: string;
	user_id: string;
	expires: number;
	idle_expires: number;
};

export const convertUserResponse = (res: SingleResponse<FaunaUserSchema>): UserSchema => {
	const { id, hashed_password, provider_id, ...attributes } = res.data;
	return {
		id,
		provider_id,
		hashed_password: hashed_password ?? null,
		...attributes
	}
};
