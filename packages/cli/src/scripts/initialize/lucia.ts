import path from "path";
import { confirmPrompt, inputPrompt } from "../../ui/prompts/index.js";
import { getPath, getRelativeFilePath, writeData } from "../utils.js";
import { database, DATABASE, framework, FRAMEWORK, Import } from "./constant.js";

const defaultLuciaFileLocation: Record<FRAMEWORK | "OTHER", string> = {
	SVELTEKIT: "src/lib/server",
	NEXTJS: "lib",
	ASTRO: "src/lib",
	OTHER: ""
};

export const initializeLucia = async ({
	frameworkId,
	databaseId,
	typescript,
	dbFileDir
}: {
	frameworkId: FRAMEWORK | null;
	databaseId: DATABASE | null;
	typescript: boolean;
	dbFileDir?: string;
}): Promise<boolean> => {
	const setLuciaFile = await confirmPrompt(
		`Initialize Lucia by creating a lucia.${typescript ? "ts" : "js"} file?`
	);
	if (!setLuciaFile) return false;
	const luciaFileLocation = await inputPrompt(
		"Which directory should the file be created in?",
		defaultLuciaFileLocation[frameworkId ?? "OTHER"]
	);
	const fw = frameworkId ? framework[frameworkId] : null;
	const db = databaseId ? database[databaseId] : null;
	const luciaFilePath = getPath(`./${luciaFileLocation}/lucia.${typescript ? "ts" : "js"}`);
	const generateLuciaFile = async () => {
		const getLuciaFileContent = async (): Promise<string> => {
			const getImportStatements = (): string => {
				const imports: Import[] = [
					{
						type: "default",
						name: "lucia",
						from: "lucia-auth"
					}
				];
				if (db) {
					const dbFileLocation = dbFileDir
						? getRelativeFilePath(luciaFilePath, getPath(`./${dbFileDir}/db.js`))
						: null;
					imports.push(
						{ type: "default", name: db.id.toLowerCase(), from: db.package },
						...db.adapter.getImports({
							dbFileLocation: dbFileLocation?.startsWith(".") ? dbFileLocation : `./${dbFileLocation}`
						})
					);
				}
				if (fw) {
					imports.push(...fw.lucia.imports);
				}
				return imports
					.map((importVal) => {
						if (importVal.type === "module")
							return `import { ${importVal.vars.toString()} } from "${importVal.from}";`;
						if (importVal.type === "default")
							return `import ${importVal.name} from "${importVal.from}";`;
						return `import "${importVal.from}";`;
					})
					.join("\n");
			};
			const adapter = `${db?.id.toLowerCase()}(${db?.adapter.getArgs(fw?.env || "process.env")})`;
			const devConfig = fw ? fw.lucia.dev : `process.env.PROD === "TRUE" ? "PROD" : "DEV"`;
			return `${getImportStatements()}

export const auth = lucia({
	adapter: ${adapter},
	env: ${devConfig}
});${
				typescript
					? `	
export type Auth = typeof auth`
					: ""
			}`;
		};
		const luciaFileContent = await getLuciaFileContent();
		writeData(luciaFilePath, luciaFileContent);
	};
	await generateLuciaFile();
	return true;
};
