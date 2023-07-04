import type { KeySchema, SessionSchema, UserSchema } from "lucia-auth";
import type { UserDoc, SessionDoc, KeyDoc } from "./docs.js";

export const transformUserDoc = (row: UserDoc): UserSchema => {
	delete row.$__;
	delete row.__v;
	delete row._doc;
	const { _id: id, ...attributes } = row;
	return {
		id,
		...attributes
	};
};

export const transformSessionDoc = (row: SessionDoc): SessionSchema => {
	return {
		id: row._id,
		user_id: row.user_id,
		active_expires: row.active_expires,
		idle_expires: row.idle_expires
	};
};

export const transformKeyDoc = (row: KeyDoc): KeySchema => {
	return {
		id: row._id,
		user_id: row.user_id,
		hashed_password: row.hashed_password ?? null,
		primary_key: row.primary_key,
		expires: row.expires ?? null
	};
};
