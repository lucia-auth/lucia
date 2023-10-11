import Cypher from "@neo4j/cypher-builder";
import { cypherNode, cypherRelation } from "./utils.js";

export const NODE_NAMES = {
	user: "User",
	session: "UserSession",
	key: "UserKey"
};

export type NodeNames = 'user' | 'session' | 'key';

export const USER_NODE = cypherNode([NODE_NAMES.user]);
export const KEY_NODE = cypherNode([NODE_NAMES.key]);
export const SESSION_NODE = cypherNode([NODE_NAMES.session]);
export const BELONGS_TO_RELATION = cypherRelation("BELONGS_TO");

export const belongsToPatten = (
	fromNode: Cypher.Node,
	toNode: Cypher.Node
) => new Cypher.Pattern(fromNode).related(BELONGS_TO_RELATION).withoutVariable().to(toNode);
