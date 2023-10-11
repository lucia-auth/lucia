import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { Database, testAdapter } from "@lucia-auth/adapter-test";
import { KeySchema, LuciaError, Session, SessionSchema } from "lucia";
import {
	BELONGS_TO_RELATION,
	KEY_NODE,
	NODE_NAMES,
	SESSION_NODE,
	USER_NODE
} from "../src/constants";
import { neo4jAdapter } from "../src/neo4j-driver";
import {
	transformKeyNode,
	transformSessionNode,
	transformUserNode
} from "../src/node-transforming";
import { createNodeAndRelationBoundToExistingNode } from "../src/utils";
import { driver } from "./db";

async function injectUserIdInNode<T>(
	session: Session,
	node: string,
	nodeModifier?: (node: T) => T
): Promise<T[]> {
	const execute = await session.run(
		`MATCH (n:${node})-[:BELONGS_TO]->(u:User) RETURN n, u`
	);

	return execute.records.map((record) => {
		const node = record.get("n").properties;
		const userNode = record.get("u").properties;

		node.user_id = userNode.id;
		if (nodeModifier) {
			return nodeModifier(node);
		}

		return node;
	});
}

const createTableQueryHandler = (node: string): TableQueryHandler => {
	const result: TableQueryHandler = {
		get: async () => {
			const session = driver.session();
			const execute = await session.run(`MATCH (n:${node}) RETURN n`);

			if (node === NODE_NAMES.user) {
				return execute.records.map((record) => {
					return transformUserNode(
						`createTableQueryHandler-get-test`,
						record.get("n").properties
					);
				});
			} else if (node === NODE_NAMES.session) {
				return await injectUserIdInNode<SessionSchema>(session, node, (node) =>
					transformSessionNode(`createTableQueryHandler-get-test`, node)
				);
			} else if (node === NODE_NAMES.key) {
				return await injectUserIdInNode<KeySchema>(session, node, (node) =>
					transformKeyNode(`createTableQueryHandler-get-test`, node)
				);
			} else {
				return execute.records.map((record) => record.get("n").properties);
			}
		},
		insert: async (value: any) => {
			if (node === NODE_NAMES.user) {
				await driver.session().run(`CREATE (n:${node} $props)`, {
					props: value
				});
			} else if (node === NODE_NAMES.key) {
				const { user_id, ...keyNodeProps } = value;

				const { cypher, params } =
					await createNodeAndRelationBoundToExistingNode(
						USER_NODE,
						user_id,
						BELONGS_TO_RELATION,
						KEY_NODE,
						keyNodeProps
					);

				await driver.session().run(cypher, params);
			} else if (node === NODE_NAMES.session) {
				const { user_id, ...sessionNodeProps } = value;

				const { cypher, params } =
					await createNodeAndRelationBoundToExistingNode(
						USER_NODE,
						user_id,
						BELONGS_TO_RELATION,
						SESSION_NODE,
						sessionNodeProps
					);
				await driver.session().run(cypher, params);
			}
		},
		clear: async () => {
			await driver.session().run(`MATCH (n:${node}) DETACH DELETE n`);
		}
	};

	return result;
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(NODE_NAMES.user),
	session: createTableQueryHandler(NODE_NAMES.session),
	key: createTableQueryHandler(NODE_NAMES.key)
};

const adapter = neo4jAdapter(driver)(LuciaError);

testAdapter(adapter, new Database(queryHandler));
