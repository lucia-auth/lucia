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
	dependencies: string[];
	devDependencies?: string[];
	id: T;
}

export const framework: {
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

export const database: {
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

export const packageManager: {
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

export const optionalPackage: {
	[Package in OPTIONAL_PACKAGE]: Integration<Package>;
} = {
	OAUTH: {
		id: OPTIONAL_PACKAGE.OAUTH,
		name: "OAuth",
		dependencies: ["@lucia-auth/oauth"]
	}
};