import { log } from "../../ui/log.js";
import { confirmPrompt, listPrompt } from "../../ui/prompts/index.js";
import { fileExists } from "../utils/fs.js";
import { database, DATABASE, framework, FRAMEWORK } from "./constant.js";

export const getProjectConfig = async () => {
	const detectFramework = (): FRAMEWORK | null => {
		if (fileExists("./svelte.config.js")) return FRAMEWORK.SVELTEKIT;
		if (fileExists("./next.config.js")) return FRAMEWORK.NEXTJS;
		if (fileExists("./astro.config.mjs")) return FRAMEWORK.ASTRO;
		return null;
	};

	const selectFramework = async () => {
		const detectedFrameworkId = detectFramework();
		const detectedFramework = detectedFrameworkId ? framework[detectedFrameworkId] : null;
		if (detectedFramework !== null) {
			const useDetectedFramework = await confirmPrompt(
				`Detected a ${detectedFramework.name} project - continue with this framework?`
			);
			return useDetectedFramework ? detectedFramework : null;
		}
		log("Couldn't detect a supported framework - just using the core library");
		return null;
	};

	const selectDatabase = async () => {
		const dbChoices: [DATABASE | null, string][] = [
			[DATABASE.KYSELY, "Kysely (PostgreSQL)"],
			[DATABASE.MONGOOSE, "Mongoose (MongoDB)"],
			[DATABASE.PRISMA, "Prisma (MySQL, PostgreSQL, SQL server, SQLite)"],
			[DATABASE.SUPABASE, "Supabase DB"],
			[null, "Other/custom"]
		];
		const selectedDatabaseId = await listPrompt(
			"Which database/ORM would you like to use?",
			dbChoices
		);
		const selectedDatabase = selectedDatabaseId ? database[selectedDatabaseId] : null;
		return selectedDatabase;
	};

	const selectedFramework = await selectFramework();
	const selectedDatabase = await selectDatabase();
	return {
		framework: selectedFramework,
		database: selectedDatabase
	};
};
