import Cypher from "@neo4j/cypher-builder";
import { LuciaErrorConstructor } from "lucia";

export const cypherNode = (labels: string[]) =>
	new Cypher.Node({
		labels
	});

export const cypherRelation = (type: string) =>
	new Cypher.Relationship({
		type
	});

export function paramGenerator(
	object: Record<any, any>,
	node: Cypher.Node
): Cypher.SetParam[] {
	return Object.entries(object).map(([key, value]) => {
		return [node.property(key), new Cypher.Param(value)];
	});
}

export function neo4jErrorHandler(
	LuciaError: LuciaErrorConstructor,
	method: string,
	error: any
) {
	if (error.message.includes("already exists with label")) {
		console.error(`[Lucia] ${method} failed: ${error.message}`);
		throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
	}
	throw error;
}

export const NODE_NAMES = {
	user: "User",
	session: "Session",
	key: "UserKey"
};

export const USER_NODE = cypherNode([NODE_NAMES.user]);
export const KEY_NODE = cypherNode([NODE_NAMES.key]);
export const SESSION_NODE = cypherNode([NODE_NAMES.session]);
export const USER_KEY_RELATION = cypherRelation("BELONGS_TO");
