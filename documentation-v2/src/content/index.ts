import type { MarkdownInstance } from "astro";

const mainCollectionImports = import.meta.glob("../../content/main/**");
const referenceCollectionImports = import.meta.glob(
	"../../content/reference/**"
);
const oauthCollectionImports = import.meta.glob("../../content/oauth/**");

export type Page = {
	pathname: string;
	collection: string;
	subCollection: string | null;
	pageId: string;
	order: number;
	title: string;
	htmlTitle: string;
	hidden: boolean;
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

const getPathnameSegmentsFromImportPath = (importPath: string) => {
	return importPath
		.split("/")
		.filter((segment) => segment !== ".." && segment !== "." && segment)
		.slice(1)
		.join("/");
};

const getPagesFromImports = async (
	imports: Record<string, () => Promise<any>>
): Promise<Page[]> => {
	return await Promise.all(
		Object.entries(imports)
			.filter(([importPath]) => importPath.endsWith(".md"))
			.map(async ([importPath, importFile]) => {
				const pathname = getPathnameSegmentsFromImportPath(importPath).replace(
					/\.md(?!\.md)/,
					""
				);
				const pathnameSegments = pathname.split("/");
				const markdown: MarkdownInstance<{
					title: string;
					order: number;
					format?: "code";
					hidden?: boolean;
				}> = await importFile();
				const title = markdown.frontmatter.title;
				const htmlTitle =
					markdown.frontmatter.format === "code" ? formatCode(title) : title;
				return {
					pathname,
					collection: pathnameSegments[0],
					subCollection:
						pathnameSegments.length < 3 ? null : pathnameSegments[1],
					pageId: pathnameSegments.slice(2).join("/"),
					order: markdown.frontmatter.order,
					title: markdown.frontmatter.title,
					hidden:
						pathnameSegments.length > 3
							? true
							: markdown.frontmatter.hidden ?? false,
					htmlTitle,
					Content: markdown.Content
				};
			})
	);
};

const parseCollectionImports = async (
	imports: Record<string, () => Promise<any>>
): Promise<SubCollection[]> => {
	const subCollectionConfigs = await Promise.all(
		Object.entries(imports)
			.filter(([importPath]) => importPath.endsWith(".json"))
			.map(async ([importPath, importFile]) => {
				const pathname = getPathnameSegmentsFromImportPath(importPath).replace(
					/\.json(?!\.json)/,
					""
				);
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

	const pages = await getPagesFromImports(imports);

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

export const getSubCollections = async (
	collection: "main" | "reference" | "oauth"
) => {
	if (collection === "main") {
		return await parseCollectionImports(mainCollectionImports);
	}
	if (collection === "reference") {
		return await parseCollectionImports(referenceCollectionImports);
	}
	if (collection === "oauth") {
		return await parseCollectionImports(oauthCollectionImports);
	}
	throw new Error(`Unknown collection name: ${collection}`);
};
