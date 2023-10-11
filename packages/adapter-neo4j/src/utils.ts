import Cypher from "@neo4j/cypher-builder";
import { LuciaError } from "lucia";
import { Session } from "neo4j-driver";
import {
	BELONGS_TO_RELATION,
	NodeNames,
	belongsToPatten
} from "./constants.js";
import { SessionParameters } from "./entities.js";

export const cypherNode = (labels: string[]) =>
	new Cypher.Node({
		labels
	});

export const cypherRelation = (type: string) =>
	new Cypher.Relationship({
		type
	});

/**
 *
 * @param object The object to generate the parameters from
 * @param node The node to generate the parameters for
 * @returns An array of parameters
 */
export function paramGenerator(
	object: Record<any, any>,
	node: Cypher.Node
): Cypher.SetParam[] {
	return Object.entries(object).map(([key, value]) => {
		return [node.property(key), new Cypher.Param(value)];
	});
}
export function neo4jErrorHandler(method: string, node: NodeNames, error: any) {
	const errorCode = error.code;
	const detail = `The node that failed: ${node}, errorCode: ${errorCode}, method: ${method}, error: ${error.message}`;
	console.error(detail);

	if (
		(errorCode === "Neo.ClientError.Schema.ConstraintValidationFailed" &&
			node === "user") ||
		node === "key"
	)
		throw new LuciaError(`AUTH_DUPLICATE_KEY_ID`);

	if (
		errorCode === "Neo.ClientError.Schema.ConstraintValidationFailed" &&
		node === "session"
	)
		throw new LuciaError(`AUTH_INVALID_SESSION_ID`);

	throw new LuciaError(`UNKNOWN_ERROR`);
}

/**
 * Will create a new node and relation and connect it to an exiting node with the provided id
 *
 * Matches if the giving node exists with the provided id
 * Creates a new node with the provided parameters
 *
 * @param existingNode The node to relate to
 * @param relation The relation to create
 * @param newNode The node to create
 * @param properties The properties to set on the new node
 */
export async function createNodeAndRelationBoundToExistingNode(
	existingNode: Cypher.Node,
	idOfExistingNode: string,
	relation: Cypher.Relationship,
	newNode: Cypher.Node,
	properties: any
) {
	const matchExistingNode = new Cypher.Match(existingNode).where(existingNode, {
		id: new Cypher.Param(idOfExistingNode)
	});

	const createRelation = new Cypher.Create(
		new Cypher.Pattern(newNode)
			.related(relation)
			.to(existingNode)
			.withoutLabels()
	).set(...paramGenerator(properties, newNode));

	return Cypher.concat(matchExistingNode, createRelation).build();
}

/**
 * Executes a cypher query and returns the first record
 * @param session  The neo4j session
 * @param queryNode The node to query
 * @param fromNodeId The id of the node to query
 * @returns
 */
export async function executeCypherQuery<T>(
	session: Session,
	queryNode: Cypher.Node,
	fromNodeId: string,
	source: string,
	nodeName: NodeNames
): Promise<T | null> {
	const matchCypher = new Cypher.Match(queryNode)
		.where(queryNode, { id: new Cypher.Param(fromNodeId) })
		.return(queryNode);

	const { cypher, params } = matchCypher.build();

	const result = await session
		.executeRead(async (tx) => tx.run(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());

	if (!result) return null;

	const [firstRecord] = result.records;

	if (!firstRecord) return null;

	return firstRecord.get("this0").properties;
}

/**
 * Gets the queryNode and the userNode and returns the first record and injects the user id into the queryNode.
 * @param session The neo4j session
 * @param queryNode The node to query
 * @param fromNodeId The id of the node to query
 * @param userNode The node that get pointed to by the 'belongs to' relationship
 * @param source The name of the function that called this function
 * @returns the queryNode properties with the user id injected
 */
export async function executeCypherQueryInjectUserId<T>(
	session: Session,
	queryNode: Cypher.Node,
	fromNodeId: string,
	userNode: Cypher.Node,
	source: string,
	nodeName: NodeNames
): Promise<T | null> {
	// Match session node and the belongs to relationship to the user node
	const matchCypher = new Cypher.Match(belongsToPatten(queryNode, userNode))
		.where(queryNode, { id: new Cypher.Param(fromNodeId) })
		.return(userNode, queryNode);

	const { cypher, params } = matchCypher.build();

	const result = await session
		.executeRead(async (tx) => tx.run(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());

	if (!result) return null;

	const [firstRecord] = result.records;

	if (!firstRecord) return null;

	const firstKey = firstRecord.get("this0");
	const user = firstRecord.get("this1");

	firstKey.properties.user_id = user.properties.id;

	return firstKey.properties;
}
/**
 * T: The type of the node you want to query
 * K: The type of the node you want to transform the properties to
 *
 * @param session Neo4j session
 * @param node The node you want to query
 * @param relatedNodeId The id of the other node
 * @param relatedNode The other node
 * @param transform A function to transform the node properties
 * @param LuciaError The LuciaError constructor
 * @param source The name of the function that called this function
 * @returns {@link <T[] | []>}
 */
export async function getNodesByRelatedNodeId<T, K>(
	session: Session,
	node: Cypher.Node,
	relatedNodeId: string,
	relatedNode: Cypher.Node,
	transform: (node: K) => T,
	source: string,
	nodeName: NodeNames
): Promise<T[] | []> {
	const matchCypher = new Cypher.Match(belongsToPatten(node, relatedNode))
		.where(relatedNode, { id: new Cypher.Param(relatedNodeId) })
		.return(node, relatedNode);

	const { cypher, params } = matchCypher.build();

	const nodeResult = await session
		.executeRead(async (tx) => tx.run(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());

	if (!nodeResult) return [];

	const nodeProperties = nodeResult.records.map((record) => {
		const node = record.get("this0");
		const user = record.get("this1");

		node.properties.user_id = user.properties.id;
		return transform(node);
	});

	return nodeProperties;
}

/**
 * T: The type of the node you want to query
 * K: The type of the node you want to transform the properties to
 *
 * @param session Neo4j session
 * @param node The node you want to query
 * @param relatedNodeId The id of the other node
 * @param RelatedNode The other node
 * @param transform A function to transform the node properties
 * @param LuciaError The LuciaError constructor
 * @param source The name of the function that called this function
 * @returns {@link <T[] | []>}
 */
export async function deleteNodesByRelatedNodeId(
	session: Session,
	node: Cypher.Node,
	relatedNodeId: string,
	RelatedNode: Cypher.Node,
	source: string,
	nodeName: NodeNames
): Promise<void> {
	const deleteCypher = new Cypher.Match(belongsToPatten(node, RelatedNode))
		.where(RelatedNode, { id: new Cypher.Param(relatedNodeId) })
		.detachDelete(node);
	const { cypher, params } = deleteCypher.build();

	await session
		.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());
}

export async function deleteNode(
	session: Session,
	node: Cypher.Node,
	nodeId: string,
	source: string,
	nodeName: NodeNames
): Promise<void> {
	const deleteCypher = new Cypher.Match(node)
		.where(node, { id: new Cypher.Param(nodeId) })
		.detachDelete(node);
	const { cypher, params } = deleteCypher.build();

	await session
		.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());
}

export async function updateNode(
	session: Session,
	node: Cypher.Node,
	nodeId: string,
	properties: Record<any, any>,
	source: string,
	nodeName: NodeNames
): Promise<void> {
	const updateCypher = new Cypher.Match(node)
		.where(node, { id: new Cypher.Param(nodeId) })
		.set(...paramGenerator(properties, node));

	const { cypher, params } = updateCypher.build();
	await session
		.executeWrite(async (tx) => tx.run(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());
}

/**
 *
 * @param session The neo4j session
 * @param node The node to query
 * @param nodeId The id of the node to query
 * @param relatedNode The node that get pointed to by the 'belongs to' relationship
 * @param userId The id of the user node
 * @param source The name of the function that called this function
 * @param updateProperties The properties to update on the node
 */
export async function changeNodeRelation(
	session: Session,
	node: Cypher.Node,
	nodeId: string,
	relatedNode: Cypher.Node,
	userId: string,
	source: string,
	updateProperties: Record<any, any>,
	nodeName: NodeNames
) {
	const patternCypher = new Cypher.Pattern(node)
		.related(BELONGS_TO_RELATION)
		.to(relatedNode)
		.withoutVariable();

	const matchCypherRelation = new Cypher.Match(patternCypher)
		.where(node, {
			id: new Cypher.Param(nodeId)
		})
		.set(...paramGenerator(updateProperties, node));

	const matchNewUser = new Cypher.Match(relatedNode).where(relatedNode, {
		id: new Cypher.Param(userId)
	});

	const newPatternCypher = new Cypher.Pattern(node)
		.withoutLabels()
		.related(BELONGS_TO_RELATION)
		.withoutVariable()
		.to(relatedNode)
		.withoutLabels();

	const createCypherPatteren = new Cypher.Create(newPatternCypher);

	const deleteCypher = new Cypher.RawCypher((env) => {
		const belongsToRelation = env.compile(BELONGS_TO_RELATION);
		return `DETACH DELETE ${belongsToRelation}`;
	});

	const { cypher, params } = Cypher.concat(
		matchCypherRelation,
		matchNewUser,
		createCypherPatteren,
		deleteCypher
	).build();

	await session
		.executeWrite(async (tx) => tx.run(cypher, params))
		.catch((e) => neo4jErrorHandler(source, nodeName, e))
		.finally(() => session.close());
}
