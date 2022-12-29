import mongoose from "mongoose";
import type { Database } from "@lucia-auth/adapter-test";
import mongodb from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";
import { convertSessionDoc } from "../src/utils.js";
import { LuciaError } from "lucia-auth";

dotenv.config({
	path: `${resolve()}/.env`
});

const url = process.env.MONGODB_URL;

if (!url) throw new Error(".env is not set up");

const User = mongoose.model(
	"user",
	new mongoose.Schema(
		{
			_id: {
				type: String
			},
			provider_id: {
				type: String,
				unique: true,
				required: true
			},
			hashed_password: String,
			username: {
				unique: true,
				type: String,
				required: true
			}
		},
		{ _id: false }
	)
);

const Session = mongoose.model(
	"session",
	new mongoose.Schema(
		{
			_id: {
				type: String
			},
			user_id: {
				type: String,
				required: true
			},
			expires: {
				type: Number,
				required: true
			},
			idle_expires: {
				type: Number,
				required: true
			}
		},
		{ _id: false }
	)
);
const clientPromise = mongoose.connect(url);

export const adapter = mongodb(mongoose)(LuciaError);

const inputToMongooseDoc = (obj: Record<string, any>) => {
	if (obj.id === undefined) return obj;
	const { id, ...data } = obj;
	return {
		_id: id,
		...data
	};
};

export const db: Database = {
	getUsers: async () => {
		await clientPromise;
		const userDocs = await User.find().lean();
		return userDocs.map((doc) => {
			const { _id: id, ...expectedValue } = doc;
			return {
				id,
				...expectedValue
			} as Required<{ id: string } & typeof expectedValue>;
		});
	},
	getSessions: async () => {
		await clientPromise;
		const sessionDocs = await Session.find().lean();
		return sessionDocs.map((doc) => convertSessionDoc(doc));
	},
	insertUser: async (user) => {
		const userDoc = new User(inputToMongooseDoc(user));
		await userDoc.save();
	},
	insertSession: async (session) => {
		const sessionDoc = new Session(inputToMongooseDoc(session));
		await sessionDoc.save();
	},
	clearUsers: async () => {
		await User.deleteMany().lean();
	},
	clearSessions: async () => {
		await Session.deleteMany().lean();
	}
};
