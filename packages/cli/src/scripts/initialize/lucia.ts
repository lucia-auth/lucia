import { confirmPrompt, inputPrompt } from "../../ui/prompts/index.js";
import { appendData, fileExists, getPath, getRelativeFilePath, writeData } from "../utils/fs.js";
import {
	DATABASE,
	DatabaseIntegration,
	defaultDir,
	FRAMEWORK,
	FrameworkIntegration,
	Import
} from "./constant.js";

export const initializeLucia = async ({
	framework,
	database,
	isTypescriptProject,
	absoluteDbFileDir
}: {
	framework: FrameworkIntegration<FRAMEWORK> | null;
	database: DatabaseIntegration<DATABASE> | null;
	isTypescriptProject: boolean;
	absoluteDbFileDir: string | null;
}): Promise<void> => {
	const fileExtension = isTypescriptProject ? "ts" : "js";
	const setLuciaFile = await confirmPrompt(
		`Initialize Lucia by creating a lucia.${fileExtension} file?`
	);
	if (!setLuciaFile) return;
	const luciaFileDir = await inputPrompt(
		"Which directory should the file be created in?",
		defaultDir[framework?.id ?? "DEFAULT"]
	);
	const absoluteLuciaFilePath = getPath(`./${luciaFileDir}/lucia.${fileExtension}`);
	const absoluteLuciaFilePathJs = getPath(`./${luciaFileDir}/lucia.js`);
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
				if (database) {
					const absoluteDbFilePath = `${absoluteDbFileDir}/db.js`;
					const databaseFileLocation = absoluteDbFileDir
						? getRelativeFilePath(absoluteLuciaFilePath, absoluteDbFilePath)
						: null;
					imports.push(
						{ type: "default", name: database.id.toLowerCase(), from: database.package },
						...database.adapter.getImports({
							dbFileLocation: databaseFileLocation?.startsWith(".")
								? databaseFileLocation
								: `./${databaseFileLocation}`,
							framework
						})
					);
				}
				if (framework) {
					imports.push(...framework.lucia.imports);
				}
				return imports
					.map((importVal) => {
						if (importVal.type === "module")
							return `import { ${importVal.vars.join(", ")} } from "${importVal.from}";`;
						if (importVal.type === "default")
							return `import ${importVal.name} from "${importVal.from}";`;
						return `import "${importVal.from}";`;
					})
					.join("\n");
			};
			const adapter = `${database?.id.toLowerCase()}(${database?.adapter.getArgs(
				framework?.env ?? "process.env."
			)})`;
			const devConfig = framework
				? framework.lucia.dev
				: `process.env.PROD === "TRUE" ? "PROD" : "DEV"`;
			return `${getImportStatements()}

export const auth = lucia({
	adapter: ${adapter},
	env: ${devConfig}
});${
				isTypescriptProject
					? `	
export type Auth = typeof auth`
					: ""
			}`;
		};
		const luciaFileContent = await getLuciaFileContent();
		writeData(absoluteLuciaFilePath, luciaFileContent);
	};
	await generateLuciaFile();
	const setTypeDeclarationFile = async () => {
		const typeDeclarationFile: Record<FRAMEWORK | "DEFAULT", string> = {
			SVELTEKIT: "src/app.d.ts",
			NEXTJS: "lucia.d.ts",
			ASTRO: "src/lucia.d.ts",
			DEFAULT: "lucia.d.ts"
		};
		const absoluteTypeDeclarationFilePath = getPath(
			`./${typeDeclarationFile[framework?.id ?? "DEFAULT"]}`
		);
		const typeDeclarationFileExists = fileExists(absoluteTypeDeclarationFilePath);
		const template = `/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("${getRelativeFilePath(
		absoluteTypeDeclarationFilePath,
		absoluteLuciaFilePathJs
	)}").Auth;
	type UserAttributes = {};
}`;

		if (!typeDeclarationFileExists) {
			return writeData(absoluteTypeDeclarationFilePath, template);
		}
		appendData(
			absoluteTypeDeclarationFilePath,
			`
	
	${template}`
		);
	};

	await setTypeDeclarationFile();
	return;
};
