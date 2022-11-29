// pnpm ts src/scripts/initialize/lucia.test.ts

import { DATABASE, FRAMEWORK } from "./constant.js";
import { initializeLucia } from "./lucia.js";

initializeLucia({
	frameworkId: FRAMEWORK.SVELTEKIT,
	databaseId: DATABASE.MONGOOSE,
	typescript: true,
	dbFileDir: "/test"
});
