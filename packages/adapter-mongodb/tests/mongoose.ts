import { databaseUser, testAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve } from "path";
import { MongodbAdapter } from "../src/index.js";

dotenv.config({ path: `${resolve()}/.env` });

await mongoose.connect(process.env.MONGODB_URL!);

const User = mongoose.model(
	"User",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			username: {
				unique: true,
				type: String,
				required: true
			}
		} as const,
		{ _id: false }
	)
);

const Session = mongoose.model(
	"Session",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			user_id: {
				type: String,
				required: true
			},
			expires_at: {
				type: Date,
				required: true
			},
			country: {
				type: String,
				required: true
			}
		} as const,
		{ _id: false }
	)
);

const adapter = new MongodbAdapter(
	mongoose.connection.collection("sessions") as any,
	mongoose.connection.collection("users") as any
);

await User.deleteMany();
await Session.deleteMany();

await new User({
	_id: databaseUser.id,
	username: databaseUser.attributes.username
}).save();

await testAdapter(adapter);

await User.deleteMany();
await Session.deleteMany();

process.exit(0);

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
