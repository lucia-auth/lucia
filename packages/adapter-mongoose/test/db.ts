import mongoose from "mongoose";
import type {
	LuciaQueryHandler,
	TestUserSchema
} from "@lucia-auth/adapter-test";
import mongodb from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";
import { convertKeyDoc, convertSessionDoc } from "../src/utils.js";
import { LuciaError, UserSchema } from "lucia-auth";

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
			active_expires: {
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

const Key = mongoose.model(
	"key",
	new mongoose.Schema(
		{
			_id: {
				type: String
			},
			user_id: {
				type: String,
				required: true
			},
			hashed_password: String,
			primary: {
				type: Boolean,
				required: true
			},
			expires: Number
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

export const queryHandler: LuciaQueryHandler = {
	user: {
		get: async () => {
			await clientPromise;
			const userDocs = await User.find().lean();
			return userDocs.map((doc) => {
				const { _id: id, ...attributes } = doc;
				return {
					id,
					...attributes
				} as TestUserSchema;
			});
		},
		insert: async (user) => {
			const userDoc = new User(inputToMongooseDoc(user));
			await userDoc.save();
		},
		clear: async () => {
			await User.deleteMany().lean();
		}
	},
	session: {
		get: async () => {
			await clientPromise;
			const sessionDocs = await Session.find().lean();
			return sessionDocs.map((doc) => convertSessionDoc(doc));
		},
		insert: async (session) => {
			const sessionDoc = new Session(inputToMongooseDoc(session));
			await sessionDoc.save();
		},
		clear: async () => {
			await Session.deleteMany().lean();
		}
	},
	key: {
		get: async () => {
			await clientPromise;
			const keyDocs = await Key.find().lean();
			return keyDocs.map((doc) => convertKeyDoc(doc));
		},
		insert: async (key) => {
			const keyDoc = new Key(inputToMongooseDoc(key));
			await keyDoc.save();
		},
		clear: async () => {
			await Key.deleteMany().lean();
		}
	}
};
