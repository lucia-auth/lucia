import dotenv from "dotenv";
import { resolve } from "path";
import { DataSource } from "typeorm";
import { Key, Session, User } from "../typeorm/schema.js";

dotenv.config({
	path: `${resolve()}/.env`
});

const entities = [User, Session, Key];

const dataSource = new DataSource({
  type: "postgres",
	url: process.env.PSQL_DATABASE_URL ?? "",
	entities,
  migrations: [`${resolve()}/test/setup.ts`]
});

export default dataSource
