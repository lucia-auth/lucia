import { log } from "../../ui/log.js";
import { checkboxPrompt, confirmPrompt, listPrompt } from "../../ui/prompts/index.js";
import { fileExists } from "../utils.js";
import {
	database,
	DATABASE,
	DatabaseIntegration,
	framework,
	FRAMEWORK,
	optionalPackage,
	OPTIONAL_PACKAGE,
	PACKAGE_MANAGER
} from "./constant.js";

const detectFramework = (): FRAMEWORK | null => {
	if (fileExists("./svelte.config.js")) return FRAMEWORK.SVELTEKIT;
	if (fileExists("./next.config.js")) return FRAMEWORK.NEXTJS;
	if (fileExists("./astro.config.mjs")) return FRAMEWORK.ASTRO;
	return null;
};

const detectTypescript = (): boolean => {
	if (fileExists("./tsconfig.json")) return true;
	return false;
};

export const selectFramework = async () => {
	const detectedFrameworkId = detectFramework();
	const detectedFramework = detectedFrameworkId ? framework[detectedFrameworkId] : null;
	if (detectedFramework !== null) {
		const useDetectedProject = await confirmPrompt(
			`Detected a ${detectedFramework.name} project - continue with this framework?`
		);
		if (useDetectedProject) {
			log(`Continuing with ${detectedFramework.name}`);
		} else {
			log("Just using the core library");
		}
		return detectedFramework;
	}
	log("Couldn't detect a supported framework - just using the core library");
	return null;
};

export const selectDatabase = async () => {
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
	if (selectedDatabase === null) {
		log("Not installing any database adapters");
	} else {
		log(`Selected ${selectedDatabase.name}`);
	}
	return selectedDatabase;
};

export const selectOptionalPackages = async () => {
	const packageChoices: [OPTIONAL_PACKAGE, string][] = [[OPTIONAL_PACKAGE.OAUTH, "OAuth"]];
	const checkedPackagesId = await checkboxPrompt(
		"Which packages would you like to enable?",
		packageChoices
	);
	const selectedOptionalPackages = checkedPackagesId.map((id) => optionalPackage[id]);
	if (selectedOptionalPackages.length > 0) {
		log(`Selected: ${selectedOptionalPackages.map((val) => val.name).join(", ")}`);
	} else {
		log(`Selected none`);
	}
	return selectedOptionalPackages;
};
