import { confirmPrompt } from "../../ui/prompts/index.js";
import { lineBreak, log } from "../../ui/log.js";
import { fileExists, runCommand } from "../utils.js";
import { selectDatabase, selectFramework, selectOptionalPackages } from "./project.js";
import { Integration, packageManager, PACKAGE_MANAGER } from "./constant.js";
import { initializeDatabase } from "./database/index.js";

const detectPackageManager = (): PACKAGE_MANAGER => {
	if (fileExists("./yarn.lock")) return PACKAGE_MANAGER.YARN;
	return PACKAGE_MANAGER.NPM;
};

const installDependencies = async (
	framework: Integration | null,
	database: Integration | null,
	optionalPackages: Integration[]
) => {
	const frameworkDependencies = framework?.dependencies || [];
	const databaseDependencies = database?.dependencies || [];
	const databaseDevDependencies = database?.devDependencies || [];
	const optionalPackagesDependencies = optionalPackages
		.map((val) => val.dependencies)
		.reduce((a, b) => [...a, ...b], []);
	const dependencies = [
		...databaseDependencies,
		...frameworkDependencies,
		...optionalPackagesDependencies
	];
	const devDependencies = [...databaseDevDependencies];
	const { name: packageManagerPrefix, command } = packageManager[detectPackageManager()];
	const runInstallation =
		await confirmPrompt(`Install the following dependencies using ${packageManagerPrefix}?
${[...dependencies, devDependencies.map((val) => `${val} (dev)`)].join(", ")}`);
	if (!runInstallation) return process.exit(0);
	await runCommand(
		`${packageManagerPrefix} ${command.install} ${dependencies.join(
			" "
		)} && ${packageManagerPrefix} ${command.devInstall} ${devDependencies.join(" ")}`
	);
};

export const initializeCommand = async () => {
	lineBreak();
	log("Welcome to Lucia!");
	const selectedFramework = await selectFramework();
	const selectedDatabase = await selectDatabase();
	const selectedOptionalPackages = await selectOptionalPackages();
	await installDependencies(selectedFramework, selectedDatabase, selectedOptionalPackages);
	const isDatabaseInitialized = selectedDatabase
		? await initializeDatabase(selectedDatabase.id)
		: false;
};
