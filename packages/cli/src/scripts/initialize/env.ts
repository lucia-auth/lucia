import { appendData, fileExists, writeData } from "../utils/fs.js";
import type { Env } from "./constant.js";

export const generateEnvFile = async (envVars: Env[]) => {
	const envFileExists = fileExists("./.env");
	const envVarData = envVars
		.map((envVar) => `${envVar[0]}="${envVar[1]}"${envVar[2] ? ` # ${envVar[2]}` : ""}`)
		.join("\n");
	if (!envFileExists) {
		return writeData("./.env", envVarData);
	}
	appendData(
		"./.env",
		`

${envVarData}`
	);
};
