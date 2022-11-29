import { DATABASE } from "../constant.js";
import { initializePrisma } from "./prisma.js";

export const initializeDatabase = async (databaseId: DATABASE) => {
	if (databaseId === DATABASE.PRISMA) return initializePrisma();
	return false;
};
