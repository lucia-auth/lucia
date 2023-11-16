import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { resolve } from "path";

dotenv.config({
	path: `${resolve()}/.env`
});

export const connect = async () => {
	const client = new MongoClient(process.env.MONGODB_URL as string);

	await client.connect();

	return client.db("lucia-test");
};
