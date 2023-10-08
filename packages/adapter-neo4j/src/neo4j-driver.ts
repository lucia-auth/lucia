import Cypher from "@neo4j/cypher-builder";
import { LuciaError, type Adapter, type InitializeAdapter } from "lucia";
import { Driver, Node as Neo4jNode } from "neo4j-driver";
import {
	KeyParameters,
	SessionParameters,
	UserKeyBelongsTo,
	UserParameters
} from "./entities.js";
import {
	NODE_NAMES,
	cypherNode,
	cypherRelation,
	neo4jErrorHandler,
	paramGenerator
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
				User: cypherNode([NODE_NAMES.user]),
				Session: cypherNode([NODE_NAMES.session]),
				Key: cypherNode([NODE_NAMES.key])
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
			try {
				const matchCypher = new Cypher.Match(User)
					.where(User, { id: new Cypher.Param(userId) })
					.return(User);
				const { cypher, params } = matchCypher.build();

				const userResult = await driverSession().executeRead(async (tx) =>
					tx.run<UserParameters>(cypher, params)
				);
				if (!userResult) return null;

				const firstUser = userResult.records[0];
				if (!firstUser) return null;

				return firstUser.get("this0").properties;
			} finally {
				driverSession().close();
			}
		},

		setUser: async (user, key) => {
			const createUserCypher = new Cypher.Create(User).set(
				...paramGenerator(user, User)
			);

			if (!key) {
				const { cypher, params } = createUserCypher.build();
				await driverSession()
					.executeWrite(async (tx) => tx.run<UserParameters>(cypher, params))
					.catch((e) => neo4jErrorHandler(LuciaError, "setUser", e))
					.then(() => driverSession().close());
				return;
			}

			const userKeyBelongsToPattern = new Cypher.Pattern(Key)
				.related(cypherRelation("BELONGS_TO"))
				.to(User);

			const createRelationship = new Cypher.Create(userKeyBelongsToPattern).set(
				...paramGenerator(key, Key),
				...paramGenerator(user, User)
			);

			const { cypher, params } = Cypher.concat(createRelationship).build();

			await driverSession()
				.executeWrite(async (tx) => tx.run<UserKeyBelongsTo>(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "setUser", e))
				.then(() => driverSession().close());
		},
		updateUser: async (userId, partialUser) => {
			const updateUserCypher = new Cypher.Match(User)
				.where(User, { id: new Cypher.Param(userId) })
				.set(...paramGenerator(partialUser, User));
			const { cypher, params } = updateUserCypher.build();

			await driverSession()
				.executeWrite(async (tx) => tx.run<UserParameters>(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "updateUser", e))
				.then(() => driverSession().close());
		},

		deleteUser: async (userId: string) => {
			const deleteUserCypher = new Cypher.Match(User)
				.where(User, { id: new Cypher.Param(userId) })
				.detachDelete(User);
			const { cypher, params } = deleteUserCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run<UserParameters>(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "deleteUser", e))
				.then(() => driverSession().close());
		},

		getSession: async (sessionId) => {
			const matchSessionCypher = new Cypher.Match(Session)
				.where(Session, { id: new Cypher.Param(sessionId) })
				.return(Session);
			const { cypher, params } = matchSessionCypher.build();

			const sessionResult = await driverSession().executeRead(async (tx) =>
				tx.run<SessionParameters>(cypher, params)
			);
			if (!sessionResult) return null;

			const firstSession = sessionResult.records.map((record) =>
				record.get("this0")
			)[0];
			if (!firstSession) return null;

			return firstSession.properties;
		},
		getSessionsByUserId: async (userId) => {
			if (!Session) {
				throw new Error("Session model not defined");
			}
			const sessionBelongsToPattern = new Cypher.Pattern(Session)
				.related(cypherRelation("BELONGS_TO"))
				.to(User);

			const matchSessionCypher = new Cypher.Match(sessionBelongsToPattern)
				.where(User, { id: new Cypher.Param(userId) })
				.return(Session);
			const { cypher, params } = matchSessionCypher.build();

			const sessionResult = await driverSession().executeRead(async (tx) =>
				tx.run<SessionParameters>(cypher, params)
			);
			if (!sessionResult) return [];

			const sessionProperties = sessionResult.records.map(
				(record) => record.get("this0").properties
			);

			if (!sessionProperties) return [];

			return sessionProperties;
		},
		setSession: async (session) => {
			if (!Session) {
				throw new Error("Session model not defined");
			}
			try {
				const createSessionCypher = new Cypher.Create(Session).set(
					...paramGenerator(session, Session)
				);

				const { cypher, params } = createSessionCypher.build();
				await driverSession()
					.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
					.catch((e) => neo4jErrorHandler(LuciaError, "setSession", e))
					.then(() => driverSession().close());
				return;
			} catch (e) {
				neo4jErrorHandler(LuciaError, "setUser", e);
			}


			
		},
		deleteSession: async (sessionId) => {
			if (!Session) {
				throw new Error("Session model not defined");
			}
			const deleteSessionCypher = new Cypher.Match(Session)
				.where(Session, { id: new Cypher.Param(sessionId) })
				.detachDelete(Session);
			const { cypher, params } = deleteSessionCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "deleteSession", e))
				.then(() => driverSession().close());
		},
		deleteSessionsByUserId: async (userId) => {
			if (!Session) {
				throw new Error("Session model not defined");
			}
			const sessionBelongsToPattern = new Cypher.Pattern(Session)
				.related(cypherRelation("BELONGS_TO"))
				.to(User);
			const deleteSessionCypher = new Cypher.Match(sessionBelongsToPattern)
				.where(User, { id: new Cypher.Param(userId) })
				.detachDelete(Session);
			const { cypher, params } = deleteSessionCypher.build();

			await driverSession()
				.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
				.catch((e) =>
					neo4jErrorHandler(LuciaError, "deleteSessionsByUserId", e)
				)
				.then(() => driverSession().close());
		},
		updateSession: async (sessionId, partialUser) => {
			if (!Session) {
				throw new Error("Session model not defined");
			}
			const updateSessionCypher = new Cypher.Match(Session)
				.where(Session, { id: new Cypher.Param(sessionId) })
				.set(...paramGenerator(partialUser, Session));
			const { cypher, params } = updateSessionCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run<SessionParameters>(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "updateSession", e))
				.then(() => driverSession().close());
		},

		getKey: async (keyId) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}
			const matchKeyCypher = new Cypher.Match(Key)
				.where(Key, { id: new Cypher.Param(keyId) })
				.return(Key);
			const { cypher, params } = matchKeyCypher.build();

			const keyResult = await driverSession().executeRead(async (tx) =>
				tx.run(cypher, params)
			);
			if (!keyResult) return null;

			const firstKey = keyResult.records.map((record) =>
				record.get("this0")
			)[0];
			if (!firstKey) return null;

			return firstKey.properties;
		},
		setKey: async (key) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}

			console.log("key", key.user_id);

			const createKeyCypher = new Cypher.Create(Key).set(
				...paramGenerator(key, Key)
			);

			const { cypher, params } = createKeyCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "setKey", e))
				.then(() => driverSession().close());
			return;
		},
		getKeysByUserId: async (userId) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}
			const userKeyBelongsToPattern = new Cypher.Pattern(Key)
				.related(cypherRelation("BELONGS_TO"))
				.to(User);

			const matchKeyCypher = new Cypher.Match(userKeyBelongsToPattern)
				.where(User, { id: new Cypher.Param(userId) })
				.return(Key);
			const { cypher, params } = matchKeyCypher.build();

			const keyResult = await driverSession().executeRead(async (tx) =>
				tx.run<KeyParameters>(cypher, params)
			);

			if (!keyResult) return [];

			const keyProperties = keyResult.records.map(
				(record) => record.get("this0").properties
			);

			if (!keyProperties) return [];

			return keyProperties;
		},
		deleteKey: async (keyId) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}
			const deleteKeyCypher = new Cypher.Match(Key)
				.where(Key, { id: new Cypher.Param(keyId) })
				.detachDelete(Key);

			const { cypher, params } = deleteKeyCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "deleteKey", e))
				.then(() => driverSession().close());
		},
		deleteKeysByUserId: async (userId) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}
			const userKeyBelongsToPattern = new Cypher.Pattern(Key)
				.related(cypherRelation("BELONGS_TO"))
				.to(User);

			const deleteKeyCypher = new Cypher.Match(userKeyBelongsToPattern)
				.where(User, { id: new Cypher.Param(userId) })
				.detachDelete(Key);

			const { cypher, params } = deleteKeyCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "deleteKeysByUserId", e))
				.then(() => driverSession().close());
		},
		updateKey: async (keyId, partialKey) => {
			if (!Key) {
				throw new Error("Key model not defined");
			}
			const updateKeyCypher = new Cypher.Match(Key)
				.where(Key, { id: new Cypher.Param(keyId) })
				.set(...paramGenerator(partialKey, Key));
			const { cypher, params } = updateKeyCypher.build();
			await driverSession()
				.executeWrite(async (tx) => tx.run(cypher, params))
				.catch((e) => neo4jErrorHandler(LuciaError, "updateKey", e))
				.then(() => driverSession().close());
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
