import fs from "fs";
import path from "path";
import child_process from "child_process";
import { confirmPrompt, listPrompt } from "../ui/prompts/index.js";
import { message } from "../ui/message.js";

enum FRAMEWORK {
	SVELTEKIT = "SVELTEKIT",
	NEXTJS = "NEXTJS",
	ASTRO = "ASTRO"
}

enum DATABASE {
	KYSELY = "KYSELY",
	MONGOOSE = "MONGOOSE",
	PRISMA = "PRISMA",
	SUPABASE = "SUPABASE"
}

enum PACKAGE_MANAGER {
	NPM = "NPM",
	YARN = "YARN"
}

interface Integration {
	name: string;
	dependencies: string[];
	devDependencies?: string[];
}

const framework: {
	[Framework in FRAMEWORK]: {
		id: Framework;
	} & Integration;
} = {
	SVELTEKIT: {
		name: "SvelteKit",
		id: FRAMEWORK.SVELTEKIT,
		dependencies: ["@lucia-auth/sveltekit"]
	},
	NEXTJS: {
		name: "Next.js",
		id: FRAMEWORK.NEXTJS,
		dependencies: ["@lucia-auth/nextjs"]
	},
	ASTRO: {
		name: "Astro",
		id: FRAMEWORK.ASTRO,
		dependencies: ["@lucia-auth/astro"]
	}
};

const database: {
	[Database in DATABASE]: {
		id: Database;
	} & Integration;
} = {
	KYSELY: {
		name: "Kysely",
		id: DATABASE.KYSELY,
		dependencies: ["@lucia-auth/adapter-kysely", "kysely", "pg"]
	},
	MONGOOSE: {
		name: "Mongoose",
		id: DATABASE.MONGOOSE,
		dependencies: ["@lucia-auth/adapter-mongoose", "mongoose"]
	},
	PRISMA: {
		name: "Prisma",
		id: DATABASE.PRISMA,
		dependencies: ["@lucia-auth/adapter-prisma", "@prisma/client"],
		devDependencies: ["prisma"]
	},
	SUPABASE: {
		name: "Supabase",
		id: DATABASE.SUPABASE,
		dependencies: ["@lucia-auth/adapter-supabase"]
	}
};

const packageManager: {
	[PackageManager in PACKAGE_MANAGER]: {
		id: PackageManager;
	} & {
		name: Lowercase<PACKAGE_MANAGER>;
		command: {
			install: string;
			devInstall: string;
		};
	};
} = {
	NPM: {
		id: PACKAGE_MANAGER.NPM,
		name: "npm",
		command: {
			install: "install",
			devInstall: "install -D"
		}
	},
	YARN: {
		id: PACKAGE_MANAGER.YARN,
		name: "yarn",
		command: {
			install: "add",
			devInstall: "add -dev"
		}
	}
};

const fileExists = (name: string) => {
	return fs.existsSync(path.resolve(process.cwd(), `./${name}`));
};

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

const detectPackageManager = (): PACKAGE_MANAGER => {
	if (fileExists("./yarn.lock")) return PACKAGE_MANAGER.YARN;
	return PACKAGE_MANAGER.NPM;
};

const runCommand = (command: string) => {
	return new Promise<void>((resolve) => {
		child_process.exec(command, () => resolve());
	});
};

const initializeCommand = async () => {
	message("Welcome to Lucia!");
	const detectedFrameworkId = detectFramework();
	const detectedFramework = detectedFrameworkId ? framework[detectedFrameworkId] : null;
	let selectedFramework: null | Integration = null;
	if (detectedFramework !== null) {
		const useDetectedProject = await confirmPrompt(
			`Detected a ${detectedFramework.name} project - continue with this framework?`
		);
		if (useDetectedProject) {
			message(`Continuing with ${detectedFramework.name}`);
		} else {
			message("Just using the core library");
		}
		selectedFramework = detectedFramework;
	} else {
		message("Couldn't detect a supported framework - just using the core library");
	}
	const dbChoices: [DATABASE | null, string][] = [
		[DATABASE.KYSELY, "Kysely (PostgreSQL)"],
		[DATABASE.MONGOOSE, "Mongoose (MongoDB)"],
		[DATABASE.PRISMA, "Prisma (SQL, MySQL, SQLite, PostgreSQL)"],
		[DATABASE.SUPABASE, "Supabase DB"],
		[null, "other/custom"]
	];
	const selectedDatabaseId = await listPrompt("Which database/ORM are you using?", dbChoices);
	const selectedDatabase = selectedDatabaseId ? database[selectedDatabaseId] : null;
	if (selectedDatabase === null) {
		message("Not installing any database adapters");
	} else {
		message(`Selected ${selectedDatabase.name}`);
	}
	const databaseDependencies = selectedDatabase?.dependencies || [];
	const databaseDevDependencies = selectedDatabase?.devDependencies || [];
	const frameworkDependencies = selectedFramework?.dependencies || [];
	const dependencies = [...databaseDependencies, ...frameworkDependencies];
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

initializeCommand();
