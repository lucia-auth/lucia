import { DATABASE, DatabaseIntegration, FRAMEWORK, FrameworkIntegration } from "../constant.js";
import { initializeKysely } from "./kysely.js";
import { initializeMongoose } from "./mongoose.js";
import { initializePrisma } from "./prisma.js";

export const initializeDatabase = async (
	database: DatabaseIntegration<DATABASE>,
	framework: FrameworkIntegration<FRAMEWORK> | null,
	isTypescriptProject: boolean
): Promise<[isDbInitialized: boolean, absoluteDbFilePath: string | null]> => {
	if (database.id === DATABASE.PRISMA) return initializePrisma();
	if (database.id === DATABASE.MONGOOSE) return initializeMongoose(framework, isTypescriptProject);
	if (database.id === DATABASE.KYSELY) return initializeKysely(framework, isTypescriptProject);
	if (database.id === DATABASE.SUPABASE) return [true, null];
	return [false, null];
};
