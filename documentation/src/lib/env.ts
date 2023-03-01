const parseEnvFile = async (resolveEnvFile: () => Promise<string>) => {
	const rawEnvFile = await resolveEnvFile();
	const envVars = rawEnvFile.split("\n");
	const envMap = new Map<string, string>();
	for (const envVar of envVars) {
		if (!envVar) continue;
		const [varName, value] = envVar.split("=");
		if (!varName || !value) continue;
		envMap.set(varName, JSON.parse(value));
	}
	return envMap;
};

const envPromise = parseEnvFile(
	Object.values(
		import.meta.glob("/.env", {
			as: "raw"
		})
	)[0]
);

export const envVar = async (key: string): Promise<string> => {
	const env = await envPromise;
	const envValue = env.get(key);
	if (!envValue) throw new Error(`Environment variable ${key} is undefined`);
	return envValue;
};
