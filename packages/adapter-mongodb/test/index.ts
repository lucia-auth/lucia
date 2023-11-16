import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { Database, testAdapter } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { Collection } from "mongodb";
import { mongodb } from "../src/index.js";
import {
	createMongoValues,
	transformKeyDoc,
	transformSessionDoc,
	transformUserDoc
} from "../src/mongodb.js";
import { connect } from "./db.js";

const createPartialTableQueryHandler = (
	collection: Collection
): Pick<TableQueryHandler, "insert" | "clear"> => {
	return {
		insert: async (value) => {
			await collection.insertOne(createMongoValues(value));
		},

		clear: async () => {
			await collection.deleteMany({});
		}
	};
};

const db = await connect();

const User = db.collection("User");
const Session = db.collection("Session");
const Key = db.collection("Key");

const queryHandler: QueryHandler = {
	user: {
		get: async () => {
			const userDocs = await User.find().toArray();
			return userDocs.map((doc) => transformUserDoc(doc) as any);
		},
		...createPartialTableQueryHandler(User)
	},
	session: {
		get: async () => {
			const sessionDocs = await Session.find().toArray();
			return sessionDocs.map((doc) => transformSessionDoc(doc));
		},
		...createPartialTableQueryHandler(Session)
	},
	key: {
		get: async () => {
			const keyDocs = await Key.find().toArray();
			return keyDocs.map((doc) => transformKeyDoc(doc as any));
		},
		...createPartialTableQueryHandler(Key)
	}
};

const adapter = mongodb({
	User,
	Session,
	Key
})(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
