import * as dotenv from "dotenv";
import neo4j from "neo4j-driver";
import { resolve } from "path";

dotenv.config({
	path: `${resolve()}/.env`
});

export const driver = neo4j.driver(
	process.env.NEO4J_URL || "bolt://localhost:7687",
	neo4j.auth.basic(
		process.env.NEO4J_USER || "neo4j",
		process.env.NEO4J_PASSWORD || "password"
	),
	{
		encrypted: false
	}
);

export const session = driver.session({
	defaultAccessMode: neo4j.session.WRITE,
	database: process.env.NEO4J_DATABASE || "neo4j"
});

console.log(`Server started at ${process.env.NEO4J_URL}`);
