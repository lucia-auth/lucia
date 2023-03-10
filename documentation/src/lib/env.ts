const loadEnv = async () => {
	const envVars: string[] = [];
	const resolveEnvFile = Object.values(
		import.meta.glob("/.env", {
			as: "raw"
		})
	).at(0);
	if (resolveEnvFile) {
		const rawEnvFile = await resolveEnvFile();
		envVars.push(...rawEnvFile.split("\n"));
	}
	const envMap = new Map<string, undefined | string>(
		Object.entries(process.env)
	);
	for (const envVar of envVars) {
		if (!envVar) continue;
		const [varName, value] = envVar.split("=");
		if (!varName || !value) continue;
		envMap.set(varName, JSON.parse(value));
	}
	return envMap;
};

const envPromise = loadEnv();

export const envVar = async (key: string): Promise<string> => {
	const env = await envPromise;
	const envValue = env.get(key) ?? null;
	if (!envValue) throw new Error(`Environment variable ${key} is undefined`);
	return envValue;
};
