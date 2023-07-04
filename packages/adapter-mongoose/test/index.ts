import { Model } from "mongoose";
import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { mongoose } from "../src/index.js";
import {
	createMongoValues,
	transformKeyDoc,
	transformSessionDoc,
	transformUserDoc
} from "../src/mongoose.js";
import { User, Key, Session, connect } from "./db.js";

import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";

const createPartialTableQueryHandler = (
	Model: Model<any>
): Pick<TableQueryHandler, "insert" | "clear"> => {
	return {
		insert: async (value) => {
			const sessionDoc = new Model(createMongoValues(value));
			await sessionDoc.save();
		},
		clear: async () => {
			await Model.deleteMany();
		}
	};
};

const queryHandler: QueryHandler = {
	user: {
		get: async () => {
			const userDocs = await User.find().lean();
			return userDocs.map((doc) => transformUserDoc(doc) as any);
		},
		...createPartialTableQueryHandler(User)
	},
	session: {
		get: async () => {
			const sessionDocs = await Session.find().lean();
			return sessionDocs.map((doc) => transformSessionDoc(doc));
		},
		...createPartialTableQueryHandler(Session)
	},
	key: {
		get: async () => {
			const keyDocs = await Key.find().lean();
			return keyDocs.map((doc) => transformKeyDoc(doc));
		},
		...createPartialTableQueryHandler(Key)
	}
};

const adapter = mongoose({
	User,
	Session,
	Key
})(LuciaError);

await connect();
await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
