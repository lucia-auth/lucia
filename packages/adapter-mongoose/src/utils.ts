import type { KeySchema, SessionSchema, UserSchema } from "lucia-auth";

export const transformUserDoc = (row: UserDoc): UserSchema => {
	const { _id: id, __v, $__, _doc, ...attributes } = row;
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
		hashed_password: row.hashed_password,
		primary: row.primary,
		expires: row.expires
	};
};
