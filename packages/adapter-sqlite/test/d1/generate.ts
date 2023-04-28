import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { resolve } from "path";

dotenv.config({
	path: `${resolve()}/.env`
});

const tomlFile = `
node_compat = true

[[d1_databases]]
binding = "${process.env.D1_DATABASE_BINDING}"
database_name = "${process.env.D1_DATABASE_NAME}"
database_id = "${process.env.D1_DATABASE_ID}"
`;

fs.writeFileSync(path.resolve("./test/d1/wrangler.toml"), tomlFile);
