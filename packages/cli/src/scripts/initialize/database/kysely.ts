import { confirmPrompt, inputPrompt } from "../../../ui/prompts/index.js";
import { getPath, writeData } from "../../utils/fs.js";
import { defaultDir, FRAMEWORK, FrameworkIntegration } from "../constant.js";

export const initializeKysely = async (
	framework: FrameworkIntegration<FRAMEWORK> | null,
	isTypescriptProject: boolean
): Promise<[isDbInitialized: boolean, absoluteDbFilePath: string | null]> => {
	const setMongooseSchema = await confirmPrompt(
		`Create db.${isTypescriptProject ? "ts" : "js"} file and set up Kysely database schema?`
	);
	if (!setMongooseSchema) return [false, null];
	const dbFileLocation = await inputPrompt(
		"Which directory should the file be created?",
		defaultDir["DEFAULT"]
	);
	const dbTemplate = `import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB } from "@lucia-auth/kysely/dbTypes";

export const db = new Kysely<DB>({
    dialect: new PostgresDialect({
        pool: new Pool({
            connectionString: ${framework?.env ?? "process.env"}.DATABASE_URL ?? ""
        })
    })
});`;
	writeData(`./${dbFileLocation}/db.${isTypescriptProject ? "ts" : "js"}`, dbTemplate);
	return [true, getPath(`./${dbFileLocation}`)];
};
