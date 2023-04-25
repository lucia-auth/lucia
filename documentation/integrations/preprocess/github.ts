import fs from "fs";
import path from "path";

const loadEnv = async () => {
	const envItems: string[] = [];
	const resolveEnvFile = Object.values(
		import.meta.glob("/.env", {
			as: "raw"
		})
	).at(0);
	if (resolveEnvFile) {
		const rawEnvFile = await resolveEnvFile();
		envItems.push(...rawEnvFile.split("\n"));
	}
	const envMap = new Map<string, undefined | string>(
		Object.entries(process.env)
	);
	for (const envItem of envItems) {
		if (!envVar) continue;
		const [varName, value] = envItem.split("=");
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

export const fetchGithub = async () => {
	const githubJsonPath = path.join(process.cwd(), ".github.json");

	if (fs.existsSync(githubJsonPath)) return;

	const GITHUB_API_KEY = await envVar("GITHUB_API_KEY");

	const contributorsResponse = await fetch(
		"https://api.github.com/repos/pilcrowonpaper/lucia/contributors?per_page=100",
		{
			headers: {
				Authorization: `Bearer ${GITHUB_API_KEY}`
			}
		}
	);
	if (!contributorsResponse.ok) {
		try {
			console.dir(await contributorsResponse.json(), {
				depth: null
			});
		} catch {
			console.log("No error body was returned");
		}
		throw new Error("Something went wrong fetching to Github");
	}
	const contributorsResult = (await contributorsResponse.json()) as
		| {
				message: string;
		  }
		| {
				avatar_url: string;
				html_url: string;
				login: string;
		  }[];
	const contributors = Array.isArray(contributorsResult)
		? contributorsResult.map((val) => {
				const url = new URL(val.avatar_url);
				url.searchParams.set("s", "128"); // set image size to 128 x 128
				url.searchParams.delete("v");
				return {
					avatar: url.href,
					profile: val.html_url,
					username: val.login
				};
		  })
		: [];
	fs.writeFileSync(path.join(githubJsonPath), JSON.stringify(contributors));
};
