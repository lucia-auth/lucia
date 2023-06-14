import type { MarkdownInstance } from "astro";

const mainCollectionImports = import.meta.glob("../../content/main/**");

export type Page = {
	pathname: string;
	collection: string;
	subCollection: string | null;
	pageId: string;
	order: number;
	title: string;
	htmlTitle: string;
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
				}> = await importFile();
				const title = markdown.frontmatter.title;
				const htmlTitle =
					markdown.frontmatter.format === "code" ? formatCode(title) : title;
				return {
					pathname,
					collection: pathnameSegments[0],
					subCollection:
						pathnameSegments.length < 3 ? null : pathnameSegments[1],
					pageId: pathnameSegments[3] ?? pathnameSegments[2],
					order: markdown.frontmatter.order,
					title: markdown.frontmatter.title,
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
					.filter(
						(page) => page.subCollection === subCollectionConfig.subCollection
					)
					.sort((a, b) => a.order - b.order)
			};
		})
		.sort((a, b) => a.order - b.order);
};

export const getSubCollections = async (collection: "main") => {
	if (collection === "main") {
		return await parseCollectionImports(mainCollectionImports);
	}
	throw new Error(`Unknown collection name: ${collection}`);
};

export const getPage = async (
	collection: "main",
	collectionPathname: string
) => {
	const pathname = [collection, collectionPathname].join("/");
	if (collection === "main") {
		const pages = await getPagesFromImports(mainCollectionImports);
		return pages.find((page) => page.pathname === pathname) ?? null;
	}
};
