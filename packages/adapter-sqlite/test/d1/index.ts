import { createSQLiteDB } from "@miniflare/shared";
import { D1Database, D1DatabaseAPI } from "@miniflare/d1";
import { fileURLToPath } from "url";
import path from "node:path";
import worker from "./worker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
	const db = await createSQLiteDB(path.join(__dirname, "../main.db"));
	const DB = new D1Database(new D1DatabaseAPI(db));
	await worker.fetch(new Request("http://localhost/"), { DB: DB as any });
};

main();
