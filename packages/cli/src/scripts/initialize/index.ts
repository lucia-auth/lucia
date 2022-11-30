import { confirmPrompt } from "../../ui/prompts/index.js";
import { lineBreak, log } from "../../ui/log.js";
import { fileExists } from "../utils/fs.js";
import { initializeDatabase } from "./database/index.js";
import { initializeLucia } from "./lucia.js";
import { getProjectConfig } from "./project.js";
import { installPackages, selectPackageManager } from "./package.js";
import type { Env } from "./constant.js";
import { generateEnvFile } from "./env.js";

export const initializeCommand = async () => {
	lineBreak();
	log("Welcome to Lucia!");
	const selectTypescript = async (): Promise<boolean> => {
		const tsconfigExists = fileExists("./tsconfig.json");
		if (!tsconfigExists) return false;
		const typescript = await confirmPrompt("Detected a TypeScript project - use TypeScript?");
		return typescript;
	};

	const isTypescriptProject = await selectTypescript();
	const { framework, database } = await getProjectConfig();
	const packageManager = await selectPackageManager();

	const installDependencies = async () => {
		const frameworkDependencies = framework ? [framework.package, ...framework.dependencies] : [];
		const frameworkDevDependencies = framework?.devDependencies ?? [];
		const databaseDependencies = database ? [database.package, ...database.dependencies] : [];
		const databaseDevDependencies = database?.devDependencies ?? [];
		const databaseTypesDependencies = database?.types ?? [];
		const dependencies = ["lucia-auth", ...databaseDependencies, ...frameworkDependencies];
		const devDependencies = [
			...frameworkDevDependencies,
			...databaseDevDependencies,
			...databaseTypesDependencies
		];
		await installPackages(dependencies, devDependencies, packageManager);
	};

	await installDependencies();

	const [isDbInitialized, absoluteDbFilePath] = database
		? await initializeDatabase(database, framework, isTypescriptProject)
		: [false, null];
	await initializeLucia({
		framework,
		database,
		isTypescriptProject: isTypescriptProject,
		absoluteDbFileDir: absoluteDbFilePath
	});
	const envVars: Env[] = [];
	if (database && isDbInitialized) {
		envVars.push(...(database.db?.envVars ?? []), ...database.adapter.envVars);
	}
	if (framework?.lucia.envVars) {
		envVars.push(...framework.lucia.envVars);
	} else {
		// no framework
		envVars.push(["PROD", "FALSE", `set to "TRUE" for production`]);
	}
	generateEnvFile(envVars);
};
