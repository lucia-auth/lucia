import fs from "fs";
import path from "path";
import child_process from "child_process";
import { checkboxPrompt, confirmPrompt, listPrompt } from "../ui/prompts/index.js";
import { lineBreak, log } from "../ui/log.js";

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

enum OPTIONAL_PACKAGE {
	OAUTH = "OAUTH"
}

interface Integration<T = string> {
	name: string;
	dependencies: string[];
	devDependencies?: string[];
	id: T;
}

const framework: {
	[Framework in FRAMEWORK]: Integration<Framework>;
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

const optionalPackage: {
	[Package in OPTIONAL_PACKAGE]: Integration<Package>;
} = {
	OAUTH: {
		id: OPTIONAL_PACKAGE.OAUTH,
		name: "OAuth",
		dependencies: ["@lucia-auth/oauth"]
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

const selectFramework = async () => {
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

const selectDatabase = async () => {
	const dbChoices: [DATABASE | null, string][] = [
		[DATABASE.KYSELY, "Kysely (PostgreSQL)"],
		[DATABASE.MONGOOSE, "Mongoose (MongoDB)"],
		[DATABASE.PRISMA, "Prisma (SQL, MySQL, SQLite, PostgreSQL)"],
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

const selectOptionalPackages = async () => {
	const packageChoices: [OPTIONAL_PACKAGE, string][] = [[OPTIONAL_PACKAGE.OAUTH, "OAuth"]];
	const checkedPackagesId = await checkboxPrompt(
		"Which packages would you like to enable?",
		packageChoices
	);
	const selectedOptionalPackages = checkedPackagesId.map((id) => optionalPackage[id]);
	if (selectedOptionalPackages.length > 0) {
		log(`Selected: ${selectedOptionalPackages.map(val => val.name).join(", ")}`)
	} else {
		log(`Selected none`)
	}
	return selectedOptionalPackages
};

export const initializeCommand = async () => {
	lineBreak();
	log("Welcome to Lucia!");
	const selectedFramework = await selectFramework();
	const selectedDatabase = await selectDatabase();
	const selectedOptionalPackages = await selectOptionalPackages();
	const databaseDependencies = selectedDatabase?.dependencies || [];
	const databaseDevDependencies = selectedDatabase?.devDependencies || [];
	const frameworkDependencies = selectedFramework?.dependencies || [];
	const optionalPackagesDependencies = selectedOptionalPackages
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
