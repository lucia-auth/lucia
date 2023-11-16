import mongodb from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import { MongooseAdapter } from "../src/index.js";
import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";

dotenv.config({
	path: `${resolve()}/.env`
});

await mongodb.connect(process.env.MONGODB_URL!);

const User = mongodb.model(
	"User",
	new mongodb.Schema(
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

const Session = mongodb.model(
	"Session",
	new mongodb.Schema(
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

const adapter = new MongooseAdapter(Session, User);

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
