import { confirmPrompt, listPrompt } from "../../../ui/prompts/index.js";
import { appendData, fileExists, runCommand, writeData } from "../../utils.js";

enum DATABASE_PROVIDER {
	MYSQL = "MYSQL",
	POSTGRESQL = "POSTGRESQL",
	SQLITE = "SQLITE",
	SQL_SERVER = "SQL_SERVER"
}

const databaseProvider: {
	[Provider in DATABASE_PROVIDER]: {
		id: Provider;
		name: string;
		prismaName: string;
	};
} = {
	MYSQL: {
		id: DATABASE_PROVIDER.MYSQL,
		name: "MySQL",
		prismaName: "mysql"
	},
	POSTGRESQL: {
		id: DATABASE_PROVIDER.POSTGRESQL,
		name: "PostgreSQL",
		prismaName: "postgresql"
	},
	SQLITE: {
		id: DATABASE_PROVIDER.SQLITE,
		name: "SQLite",
		prismaName: "sqlite"
	},
	SQL_SERVER: {
		id: DATABASE_PROVIDER.SQL_SERVER,
		name: "SQL server",
		prismaName: "sqlserver"
	}
};

const getPrismaSchemaModelTemplate = () => {
	return `model User {
	id              String    @id @unique @default(cuid())
	provider_id     String    @unique
	hashed_password String?
	username        String    @unique
	session         Session[]

	@@map("user")
}
	
model Session {
	id           String @id @unique
	user_id      String
	expires      BigInt
	idle_expires BigInt
	user         User   @relation(references: [id], fields: [user_id], onDelete: Cascade)

	@@index([user_id])
	@@map("session")
}`;
};

const getPrismaSchemaSettingsTemplate = (
	databaseProviderPrismaName: typeof databaseProvider[DATABASE_PROVIDER]["prismaName"]
) => {
	return `generator client {
	provider = "prisma-client-js"
}
	
datasource db {
	provider = "${databaseProviderPrismaName}"
	url      = env("DATABASE_URL")
}`;
};

export const initializePrisma = async (): Promise<boolean> => {
	const isPrismaInitialized = fileExists("./prisma/schema.prisma");
	if (!isPrismaInitialized) {
		const setPrismaSchema = await confirmPrompt(
			"No Prisma schema was detected - initialize Prisma and set up the schema?"
		);
		if (!setPrismaSchema) return false;

		const selectDatabaseProvider = async () => {
			const databaseProviderChoices: [DATABASE_PROVIDER, string][] = [
				DATABASE_PROVIDER.MYSQL,
				DATABASE_PROVIDER.POSTGRESQL,
				DATABASE_PROVIDER.SQLITE,
				DATABASE_PROVIDER.SQL_SERVER
			].map((provider) => [provider, databaseProvider[provider].name]);
			const selectedDatabaseProviderId = await listPrompt(
				"Which database provider would you like to use?",
				databaseProviderChoices
			);
			return databaseProvider[selectedDatabaseProviderId];
		};

		const selectedDatabaseProvider = await selectDatabaseProvider();
		await runCommand("npx prisma init");
		const prismaSchemaFile = `${getPrismaSchemaSettingsTemplate(
			selectedDatabaseProvider.prismaName
		)}

${getPrismaSchemaModelTemplate()}`;
		writeData("./prisma/schema.prisma", prismaSchemaFile);
		return true;
	}
	const setPrismaSchema = await confirmPrompt("Detected a Prisma schema - add schema for Lucia?");
	if (!setPrismaSchema) return false;
	appendData(
		"./prisma/schema.prisma",
		`
${getPrismaSchemaModelTemplate()}`
	);
	return true;
};
