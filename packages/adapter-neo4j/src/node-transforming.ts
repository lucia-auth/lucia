import { KeySchema, SessionSchema, UserSchema } from "lucia";

/**
 * Transforms a user node from the database to a user object.
 * @param source The source of the node.
 * @param user The user node.
 * @returns The user object.
 */
export function transformUserNode(
	source: string,
	user: Partial<UserSchema>
): UserSchema {
	// User is required.
	if (!user) {
		throw new Error(`User node is undefined. Source: ${source}`);
	}

	// Primary key is required.
	if (!user.id) {
		throw new Error(`User node does not have an id. Source: ${source}`);
	}

	return {
		...user,
		id: user.id
	};
}

/**
 * Transforms a session node from the database to a session object.
 * @param source The source of the node.
 * @param session The session node.
 * @returns The session object.
 */
export function transformSessionNode(
	source: string,
	session: Partial<SessionSchema>
): SessionSchema {
	// Session is required.
	if (!session) {
		throw new Error(`Session node is undefined. Source: ${source}`);
	}

	// Primary key is required.
	if (!session.id) {
		throw new Error(`Session node does not have an id. Source: ${source}`);
	}

	// User id is required.
	if (!session.user_id) {
		throw new Error(`Session node does not have a user_id. Source: ${source}`);
	}

	// Active expires is required.
	if (!session.active_expires) {
		throw new Error(
			`Session node does not have an active_expires. Source: ${source}`
		);
	}

	// Idle expires is required.
	if (!session.idle_expires) {
		throw new Error(
			`Session node does not have an idle_expires. Source: ${source}`
		);
	}

	return {
		...session,
		id: session.id,
		user_id: session.user_id,
		active_expires: session.active_expires,
		idle_expires: session.idle_expires
	};
}

/**
 * Transforms a key node from the database to a key object.
 * @param source The source of the node.
 * @param key The key node.
 * @returns The key object.
 */
export function transformKeyNode(
	source: string,
	key: Partial<KeySchema>
): KeySchema {
	// Key is required.
	if (!key) {
		throw new Error(`Key node is undefined. Source: ${source}`);
	}

	// Primary key is required.
	if (!key.id) {
		throw new Error(`Key node does not have an id. Source: ${source}`);
	}

	// User id is required.
	if (!key.user_id) {
		throw new Error(`Key node does not have a user_id. Source: ${source}`);
	}

	return {
		...key,
		id: key.id,
		user_id: key.user_id,
		hashed_password: key.hashed_password || null
	};
}
