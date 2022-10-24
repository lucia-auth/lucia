import { testAdapter, type Database } from "@lucia-sveltekit/adapter-test";
import couchdb, { transformUserDocument, setUpDatabase } from "../src/index.js";
import nano from "nano";

const url = "";
let couch: nano.ServerScope = nano(url);

const inputToCloudantDocument = (obj: Record<string, any>) => {
	if (obj.id === undefined) return obj;
	const { id, ...data } = obj;
	return {
		_id: id,
		...data
	};
};

const transformRefreshTokenDoc = (obj: Record<string, any>) => {
	delete obj._id;
	delete obj._rev;
	return obj;
};

const db: Database = {
	getUsers: async () => {
		await setUpDatabase(couch);
		const userDocs: nano.DocumentListResponse<unknown> = await couch
			.use("user")
			.list({ include_docs: true });
		// @ts-ignore
		return userDocs.rows.map((user) => transformUserDocument(user.doc)) as any[];
	},
	getRefreshTokens: async () => {
		await setUpDatabase(couch);
		const refreshTokenDocs: nano.DocumentListResponse<unknown> = await couch
			.use("refresh_token")
			.list({ include_docs: true });
		let map = refreshTokenDocs.rows.map((refreshToken) =>
			// @ts-ignore
			transformRefreshTokenDoc(refreshToken.doc)
		) as any[];
		return map;
	},
	insertUser: async (user) => {
		await setUpDatabase(couch);
		const userDoc = inputToCloudantDocument(user);
		await couch.use("user").insert(userDoc);
	},
	insertRefreshToken: async (refreshToken) => {
		await setUpDatabase(couch);
		const refreshTokenDoc = inputToCloudantDocument(refreshToken);
		await couch.use("refresh_token").insert(refreshTokenDoc);
	},
	clearUsers: async () => {
		await setUpDatabase(couch);
		const db = couch.use("user");
		const userDocs: nano.DocumentListResponse<unknown> = await db.list({ include_docs: true });
		const normalUserDocs = userDocs.rows.filter((user) => !user.id.includes("_design"));
		// @ts-ignore
		await Promise.all(normalUserDocs.map((user) => db.destroy(user.id, user.doc?._rev)));
	},
	clearRefreshTokens: async () => {
		await setUpDatabase(couch);
		// delete all non design docs
		const db = couch.use("refresh_token");
		const allDocs = await db.list({ include_docs: true });
		const normalDocs = allDocs.rows.filter((doc) => {
			return !doc.id.includes("_design");
		});
		await Promise.all(
			normalDocs.map((document) => {
				// @ts-ignore
				db.destroy(document.id, document.doc?._rev);
			})
		);
	}
};

testAdapter(couchdb(couch), db);
