export enum FRAMEWORK {
	SVELTEKIT = "SVELTEKIT",
	NEXTJS = "NEXTJS",
	ASTRO = "ASTRO"
}

export enum DATABASE {
	KYSELY = "KYSELY",
	MONGOOSE = "MONGOOSE",
	PRISMA = "PRISMA",
	SUPABASE = "SUPABASE"
}

export enum PACKAGE_MANAGER {
	NPM = "NPM",
	YARN = "YARN"
}

export enum OPTIONAL_PACKAGE {
	OAUTH = "OAUTH"
}

export interface Integration<T = string> {
	name: string;
	package: string;
	dependencies: string[];
	devDependencies?: string[];
	id: T;
}

export type Import =
	| {
			type: "module";
			vars: string[];
			from: string;
	  }
	| {
			type: "side-effect";
			from: string;
	  }
	| {
			type: "default";
			name: string;
			from: string;
	  };

type EnvImport = "process.env" | "import.meta.env";

export interface FrameworkIntegration<T extends FRAMEWORK> extends Integration<T> {
	env: EnvImport;
	lucia: {
		envVars: string[];
		imports: Import[];
		dev: string;
	};
}

export interface DatabaseIntegration<T extends DATABASE> extends Integration<T> {
	adapter: {
		envVars: string[];
		getArgs: (env: EnvImport) => string[];
		getImports: (context: { dbFileLocation?: string | null }) => Import[];
	};
}

export const framework: {
	[Framework in FRAMEWORK]: FrameworkIntegration<Framework>;
} = {
	SVELTEKIT: {
		name: "SvelteKit",
		id: FRAMEWORK.SVELTEKIT,
		package: "@lucia-auth/sveltekit",
		dependencies: [],
		lucia: {
			envVars: [],
			imports: [
				{
					type: "module",
					vars: ["dev"],
					from: "$app/environment"
				}
			],
			dev: `dev ? "DEV" : "PROD"`
		},
		env: "import.meta.env"
	},
	NEXTJS: {
		name: "Next.js",
		id: FRAMEWORK.NEXTJS,
		package: "@lucia-auth/nextjs",
		dependencies: [],
		lucia: {
			envVars: ["PROD"],
			imports: [],
			dev: `process.env.PROD === "TRUE" ? "PROD" : "DEV"`
		},
		env: "process.env"
	},
	ASTRO: {
		name: "Astro",
		id: FRAMEWORK.ASTRO,
		package: "@lucia-auth/astro",
		dependencies: [],
		lucia: {
			envVars: [],
			imports: [],
			dev: `import.meta.env.DEV ? "DEV" : "PROD"`
		},
		env: "import.meta.env"
	}
};

export const database: {
	[Database in DATABASE]: DatabaseIntegration<Database>;
} = {
	KYSELY: {
		name: "Kysely",
		id: DATABASE.KYSELY,
		package: "@lucia-auth/adapter-kysely",
		dependencies: ["kysely", "pg"],
		adapter: {
			envVars: [],
			getArgs: () => ["db"],
			getImports: (ctx) => {
				if (!ctx.dbFileLocation) throw new Error();
				return [
					{
						type: "module",
						vars: ["db"],
						from: ctx.dbFileLocation
					}
				];
			}
		}
	},
	MONGOOSE: {
		name: "Mongoose",
		id: DATABASE.MONGOOSE,
		package: "@lucia-auth/adapter-mongoose",
		dependencies: ["mongoose"],
		adapter: {
			envVars: [],
			getArgs: () => ["m"],
			getImports: ({ dbFileLocation }) => {
				if (!dbFileLocation)
					return [
						{
							type: "default",
							name: "m",
							from: "mongoose"
						}
					];
				return [
					{
						type: "default",
						name: "m",
						from: "mongoose"
					},
					{
						type: "side-effect",
						from: dbFileLocation
					}
				];
			}
		}
	},
	PRISMA: {
		name: "Prisma",
		id: DATABASE.PRISMA,
		package: "@lucia-auth/adapter-prisma",
		dependencies: ["@prisma/client"],
		devDependencies: ["prisma"],
		adapter: {
			envVars: [],
			getArgs: () => ["new PrismaClient()"],
			getImports: () => [
				{
					type: "module",
					vars: ["PrismaClient"],
					from: "@prisma/client"
				}
			]
		}
	},
	SUPABASE: {
		name: "Supabase",
		id: DATABASE.SUPABASE,
		package: "@lucia-auth/adapter-supabase",
		dependencies: [],
		adapter: {
			envVars: ["SUPABASE_URL", "SUPABASE_SECRET"],
			getArgs: (env) => [`${env}.SUPABASE_URL`, `${env}.SUPABASE_SECRET`],
			getImports: () => []
		}
	}
};

export const packageManager: {
	[PackageManager in PACKAGE_MANAGER]: {
		id: PackageManager;
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

export const optionalPackage: {
	[Package in OPTIONAL_PACKAGE]: Integration<Package>;
} = {
	OAUTH: {
		id: OPTIONAL_PACKAGE.OAUTH,
		name: "OAuth",
		package: "@lucia-auth/oauth",
		dependencies: []
	}
};
