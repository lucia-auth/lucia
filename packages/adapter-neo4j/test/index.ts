import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { Database, testAdapter } from "@lucia-auth/adapter-test";
import Cypher from "@neo4j/cypher-builder";
import { LuciaError } from "lucia";
import { neo4jAdapter } from "../src/neo4j-driver";
import {
	NODE_NAMES,
	cypherNode,
	cypherRelation,
	paramGenerator
} from "../src/utils";
import { driver } from "./db";

const USER_NODE = cypherNode([NODE_NAMES.user]);
const KEY_NODE = cypherNode([NODE_NAMES.key]);
const SESSION_NODE = cypherNode([NODE_NAMES.session]);

const BELONGS_TO_RELATION = cypherRelation("BELONGS_TO");


const createRelationship = async (value: any, nodeType: Cypher.Node, relationType: Cypher.Relationship) => {
    const matchUser = new Cypher.Match(USER_NODE).where(USER_NODE, {
        id: new Cypher.Param(value.user_id)
    });

    const pattern = new Cypher.Pattern(nodeType)
        .related(relationType)
        .to(USER_NODE)
        .withoutLabels();

    const createRelationship = new Cypher.Create(pattern).set(...paramGenerator(value, nodeType));

    const { cypher, params } = Cypher.concat(matchUser, createRelationship).build();
    await driver.session().run(cypher, params);
};

const createTableQueryHandler = (node: string): TableQueryHandler => {
	const result: TableQueryHandler = {
		get: async () => {
			const result = await driver.session().run(`MATCH (n:${node}) RETURN n`);
			return result.records.map((record) => record.get("n").properties);
		},
		insert: async (value: any) => {
			if (node === NODE_NAMES.user) {
				await driver.session().run(`CREATE (n:${node} $props)`, {
					props: value
				});
			} else if (node === NODE_NAMES.key) {
				const matchUser = new Cypher.Match(USER_NODE).where(USER_NODE, {
					id: new Cypher.Param(value.user_id)
				});

				const UserKeyBelongsToPattern = new Cypher.Pattern(KEY_NODE)
					.related(BELONGS_TO_RELATION)
					.to(USER_NODE)
					.withoutLabels();

				const createRelationship = new Cypher.Create(
					UserKeyBelongsToPattern
				).set(...paramGenerator(value, KEY_NODE));

				const { cypher, params } = Cypher.concat(
					matchUser,
					createRelationship
				).build();
				await driver.session().run(cypher, params);
			} else if (node === NODE_NAMES.session) {
				const matchUser = new Cypher.Match(USER_NODE).where(USER_NODE, {
					id: new Cypher.Param(value.user_id)
				});

				const UserSessionBelongsToPattern = new Cypher.Pattern(SESSION_NODE)
					.related(BELONGS_TO_RELATION)
					.to(USER_NODE)
					.withoutLabels();

				const createRelationship = new Cypher.Create(
					UserSessionBelongsToPattern
				).set(...paramGenerator(value, SESSION_NODE));

				const { cypher, params } = Cypher.concat(
					matchUser,
					createRelationship
				).build();
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
