import { confirmPrompt, inputPrompt } from "../../../ui/prompts/index.js";
import { getPath, writeData } from "../../utils/fs.js";
import { defaultDir, FRAMEWORK, FrameworkIntegration } from "../constant.js";

export const initializeKysely = async (
	framework: FrameworkIntegration<FRAMEWORK> | null,
	isTypescriptProject: boolean
): Promise<[isDbInitialized: boolean, absoluteDbFilePath: string | null]> => {
	const setKyselySchema = await confirmPrompt(
		`Create db.${isTypescriptProject ? "ts" : "js"} file and set up Kysely database schema?`
	);
	if (!setKyselySchema) return [false, null];
	const dbFileLocation = await inputPrompt(
		"Which directory should the file be created?",
		defaultDir[framework?.id ?? "DEFAULT"]
	);
	const dbTemplate = `import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
${framework?.id === FRAMEWORK.SVELTEKIT ? `import { DATABASE_URL } from "$env/static/private";\n` : ""}
import type { DB } from "@lucia-auth/kysely/dbTypes";

export const db = new Kysely<DB>({
    dialect: new PostgresDialect({
        pool: new Pool({
            connectionString: ${framework?.env ?? "process.env"}DATABASE_URL ?? ""
        })
    })
});`;
	writeData(`./${dbFileLocation}/db.${isTypescriptProject ? "ts" : "js"}`, dbTemplate);
	return [true, getPath(`./${dbFileLocation}`)];
};
