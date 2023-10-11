import type {
	KeySchema,
	SessionSchema,
	UserSchema,
} from "lucia";
import type { Integer, Node } from "neo4j-driver";

export type UserProperties = Node<Integer, UserSchema>;

export type SessionProperties = Node<Integer, SessionSchema>;

export type KeyProperties = Node<Integer,  KeySchema>;

/**
 * @field this0: {@link T}
 * @field this1: {UserProperties}
 */
export interface BelongsToUserParameters<T extends Node> {
	this0: T;
	this1: UserProperties;
}

/**
 * @field this0: User
 */
export interface UserParameters {
	this0: UserProperties;
}

/**
 * @field this0: Key
 */
export interface SessionParameters {
	this0: SessionProperties;
}

/**
 * @field this0: Session
 */
export interface KeyParameters {
	this0: KeyProperties;
}