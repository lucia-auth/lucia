import Cypher from "@neo4j/cypher-builder";
import {
	KeySchema,
	SessionSchema,
	UserSchema,
	type Adapter,
	type InitializeAdapter
} from "lucia";
import { Driver, Node as Neo4jNode } from "neo4j-driver";
import {
	BELONGS_TO_RELATION,
	KEY_NODE,
	SESSION_NODE,
	USER_NODE,
	belongsToPatten
} from "./constants.js";
import {
	BelongsToUserParameters,
	KeyProperties,
	SessionParameters,
	SessionProperties,
	UserParameters,
	UserProperties
} from "./entities.js";
import {
	transformKeyNode,
	transformSessionNode,
	transformUserNode
} from "./node-transforming.js";
import {
	changeNodeRelation,
	createNodeAndRelationBoundToExistingNode,
	cypherNode,
	deleteNode,
	deleteNodesByRelatedNodeId,
	executeCypherQuery,
	executeCypherQueryInjectUserId,
	getNodesByRelatedNodeId,
	neo4jErrorHandler,
	paramGenerator,
	updateNode
} from "./utils.js";

export const neo4jAdapter = (
	driver: Driver,
	nodes?: {
		User: Neo4jNode;
		Key: Neo4jNode;
		Session: Neo4jNode;
	}
): InitializeAdapter<Adapter> => {
	const getAllNodes = () => {
		if (!nodes)
			return {
				User: USER_NODE,
				Session: SESSION_NODE,
				Key: KEY_NODE
			};
		return {
			User: cypherNode(nodes.User.labels),
			Session: cypherNode(nodes.Session.labels),
			Key: cypherNode(nodes.Key.labels)
		};
	};

	const { User, Session, Key } = getAllNodes();
	const driverSession = () => driver.session();

	const useAdapter: Adapter = {
		getUser: async (userId: string) => {
			const UserSchema = await executeCypherQuery<UserSchema>(
				driverSession(),
				User,
				userId,
				"getUser",
				"user"
			);

			if (!UserSchema) return null;

			return transformUserNode(`GetUser-adapter`, UserSchema);
		},

		setUser: async (user, key) => {
			const createUserCypher = new Cypher.Create(User).set(
				...paramGenerator(user, User)
			);

			if (!key) {
				const { cypher, params } = createUserCypher.build();
				await driverSession()
					.executeWrite(async (tx) => tx.run<UserParameters>(cypher, params))
					.catch((e) => neo4jErrorHandler("setUser", "key", e))
					.finally(() => driverSession().close());
				return;
			}

			const createRelationship = new Cypher.Create(
				belongsToPatten(Key, User)
			).set(...paramGenerator(key, Key), ...paramGenerator(user, User));

			const { cypher, params } = Cypher.concat(createRelationship).build();

			await driverSession()
				.executeWrite(async (tx) =>
					tx.run<BelongsToUserParameters<UserProperties>>(cypher, params)
				)
				.catch((e) => neo4jErrorHandler("setUser", "user", e))
				.finally(() => driverSession().close());
		},
		updateUser: async (userId, partialUser) => {
			await updateNode(
				driverSession(),
				User,
				userId,
				partialUser,
				"updateUser-adapter",
				"user"
			);
		},

		deleteUser: async (userId: string) => {
			await deleteNode(
				driverSession(),
				User,
				userId,
				"deleteUser-adapter",
				"user"
			);
		},

		getSession: async (sessionId) => {
			const SessionSchema = await executeCypherQueryInjectUserId<SessionSchema>(
				driverSession(),
				Session,
				sessionId,
				User,
				"getSession",
				"session"
			);

			if (!SessionSchema) return null;

			return transformSessionNode(`getSession-adapter`, SessionSchema);
		},

		getSessionsByUserId: async (userId) => {
			const sessionByUserId = await getNodesByRelatedNodeId<
				SessionSchema,
				SessionProperties
			>(
				driverSession(),
				Session,
				userId,
				User,
				(node) =>
					transformSessionNode(`GetSessionByUserId-adapter`, node.properties),
				"getSessionsByUserId",
				"session"
			);

			return sessionByUserId;
		},

		setSession: async (session) => {
			const { user_id: userId, ...sessionProperties } = session;

			const { cypher, params } = await createNodeAndRelationBoundToExistingNode(
				User,
				userId,
				BELONGS_TO_RELATION,
				Session,
				sessionProperties
			);

			await driverSession()
				.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
				.catch((e) => neo4jErrorHandler("setSession", "session", e))
				.finally(() => driverSession().close());
			return;
		},

		deleteSession: async (sessionId) => {
			await deleteNode(
				driverSession(),
				Session,
				sessionId,
				"deleteSession",
				"session"
			);
		},

		deleteSessionsByUserId: async (userId) => {
			await deleteNodesByRelatedNodeId(
				driverSession(),
				Session,
				userId,
				User,
				"deleteSessionsByUserId",
				"session"
			);
		},

		updateSession: async (sessionId, partialSession) => {
			const { user_id: userId, ...sessionProperties } = partialSession;

			if (userId) {
				return await changeNodeRelation(
					driverSession(),
					Session,
					sessionId,
					User,
					userId,
					"updateSession-adapter",
					sessionProperties,
					"session"
				);
			}

			await updateNode(
				driverSession(),
				Session,
				sessionId,
				sessionProperties,
				"updateSession-adapter",
				"session"
			);
		},

		getKey: async (keyId) => {
			const KeySchema = await executeCypherQueryInjectUserId<KeySchema>(
				driverSession(),
				Key,
				keyId,
				User,
				"getKey",
				"key"
			);

			if (!KeySchema) return null;

			return transformKeyNode(`getKey-adapter`, KeySchema);
		},

		setKey: async (key) => {
			const { user_id: userId, ...keyProperties } = key;

			const { cypher, params } = await createNodeAndRelationBoundToExistingNode(
				User,
				userId,
				BELONGS_TO_RELATION,
				Key,
				keyProperties
			);

			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler("setKey", "key", e))
				.finally(() => driverSession().close());
			return;
		},

		getKeysByUserId: async (userId) => {
			const keysByUserId = await getNodesByRelatedNodeId<
				KeySchema,
				KeyProperties
			>(
				driverSession(),
				Key,
				userId,
				User,
				(node) => transformKeyNode(`getKeysByUserId-adapter`, node.properties),
				"getKeysByUserId",
				"key"
			);

			return keysByUserId;
		},

		deleteKey: async (keyId) => {
			await deleteNode(driverSession(), Key, keyId, "deleteKey-adapter", "key");
		},

		deleteKeysByUserId: async (userId) => {
			const userKeyBelongsToPattern = new Cypher.Pattern(Key)
				.related(BELONGS_TO_RELATION)
				.to(User);

			const deleteKeyCypher = new Cypher.Match(userKeyBelongsToPattern)
				.where(User, { id: new Cypher.Param(userId) })
				.detachDelete(Key);

			const { cypher, params } = deleteKeyCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler("deleteKeysByUserId", "user", e))
				.finally(() => driverSession().close());
		},

		updateKey: async (keyId, partialKey) => {
			const { user_id: userId, ...keyProperties } = partialKey;

			if (userId) {
				return await changeNodeRelation(
					driverSession(),
					Key,
					keyId,
					User,
					userId,
					"updateKey-adapter",
					keyProperties,
					"key"
				);
			}

			await updateNode(
				driverSession(),
				Key,
				keyId,
				keyProperties,
				"updateKey-adapter",
				"key"
			);
		},

		getSessionAndUser: async (sessionId) => {
			const matchSessionCypher = new Cypher.Match(
				belongsToPatten(Session, User)
			)
				.where(Session, { id: new Cypher.Param(sessionId) })
				.return(User, Session);

			const { cypher, params } = matchSessionCypher.build();

			const sessionResult = await driverSession()
				.executeRead(async (tx) =>
					tx.run<BelongsToUserParameters<SessionProperties>>(cypher, params)
				)
				.catch((e) => neo4jErrorHandler("getSessionAndUser", "session", e))
				.finally(() => driverSession().close());

			if (!sessionResult) return [null, null];

			const [firstRecord] = sessionResult.records;

			if (!firstRecord) return [null, null];

			const firstKey = firstRecord.get("this0");

			const user = firstRecord.get("this1");

			firstKey.properties.user_id = user.properties.id;

			return [
				transformSessionNode(`getSessionAndUser-adapter`, firstKey.properties),
				transformUserNode(`getSessionAndUser-adapter`, user.properties)
			];
		}
	};

	const initializeAdapter: InitializeAdapter<Adapter> = (E) => {
		if (!E) {
			throw new Error("LuciaError constructor not defined");
		}
		return useAdapter;
	};

	return initializeAdapter;
};
