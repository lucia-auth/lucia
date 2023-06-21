import type { MarkdownInstance } from "astro";

const collectionImports = import.meta.glob("../../content/**");

export type Page = {
	pathname: string;
	collection: string;
	subCollection: string | null;
	pageId: string;
	order: number;
	title: string;
	htmlTitle: string;
	hidden: boolean;
	description: string | null;
	Content: MarkdownInstance<any>["Content"];
};

export type SubCollection = {
	pathname: string;
	collection: string;
	subCollection: string | null;
	order: number;
	title: string;
	htmlTitle: string;
	pages: Page[];
};

const formatCode = (text: string) => {
	return `<code>${text}</code>`;
};

const getPathnameFromImportPath = (importPath: string) => {
	return importPath
		.split("/")
		.filter((segment) => segment !== ".." && segment !== "." && segment)
		.slice(1)
		.join("/")
		.replace(/\.md(?!\.md)/, "")
		.replace(/\.json(?!\.json)/, "");
};

const getPagesFromImports = async (
	imports: Record<string, () => Promise<any>>
): Promise<Page[]> => {
	return await Promise.all(
		Object.entries(imports)
			.filter(([importPath]) => importPath.endsWith(".md"))
			.map(async ([importPath, resolveImport]) =>
				transformMarkdownImport(importPath, resolveImport)
			)
	);
};

const transformMarkdownImport = async (
	importPath: string,
	resolveImport: () => Promise<any>
) => {
	const pathname = getPathnameFromImportPath(importPath);
	const pathnameSegments = pathname.split("/");
	const markdown: MarkdownInstance<{
		title: string;
		order: number;
		format?: "code";
		hidden?: boolean;
		description?: string;
	}> = await resolveImport();
	const title = markdown.frontmatter.title;
	const htmlTitle =
		markdown.frontmatter.format === "code" ? formatCode(title) : title;
	return {
		pathname,
		description: markdown.frontmatter.description ?? null,
		collection: pathnameSegments[0],
		subCollection: pathnameSegments.length < 3 ? null : pathnameSegments[1],
		pageId: pathnameSegments.slice(2).join("/"),
		order: markdown.frontmatter.order,
		title: markdown.frontmatter.title,
		hidden:
			pathnameSegments.length > 3 ? true : markdown.frontmatter.hidden ?? false,
		htmlTitle,
		Content: markdown.Content
	};
};

export const getSubCollections = async (
	collectionId: "main" | "reference" | "oauth"
): Promise<SubCollection[]> => {
	const selectedCollectionImports = Object.fromEntries(
		Object.entries(collectionImports).filter(([importPath]) => {
			const pathname = getPathnameFromImportPath(importPath);
			return pathname.split("/").at(0) === collectionId;
		})
	);
	const subCollectionConfigs = await Promise.all(
		Object.entries(selectedCollectionImports)
			.filter(([importPath]) => importPath.endsWith(".json"))
			.map(async ([importPath, importFile]) => {
				const pathname = getPathnameFromImportPath(importPath);
				const pathnameSegments = pathname.split("/");
				const parsedJson = (await importFile()) as {
					title: string;
					order: number;
					format?: "code";
				};
				const htmlTitle =
					parsedJson.format === "code"
						? formatCode(parsedJson.title)
						: parsedJson.title;
				return {
					pathname,
					collection: pathnameSegments[0],
					subCollection:
						pathnameSegments.length < 3 ? null : pathnameSegments[1],
					order: parsedJson.order,
					title: parsedJson.title,
					htmlTitle
				};
			})
	);

	const pages = await getPagesFromImports(selectedCollectionImports);

	return subCollectionConfigs
		.map((subCollectionConfig) => {
			return {
				...subCollectionConfig,
				pages: pages
					.filter((page) => {
						return page.subCollection === subCollectionConfig.subCollection;
					})
					.sort((a, b) => a.order - b.order)
			};
		})
		.sort((a, b) => a.order - b.order);
};

export const getPage = async (...path: string[]) => {
	const targetPathname = path.join("/");
	const targetImportEntry = Object.entries(collectionImports).find(
		([importPath]) => {
			return getPathnameFromImportPath(importPath) === targetPathname;
		}
	);
	if (!targetImportEntry) throw new Error(`Not found: ${targetPathname}`);
	const [importPath, resolveImport] = targetImportEntry;
	return await transformMarkdownImport(importPath, resolveImport);
};
