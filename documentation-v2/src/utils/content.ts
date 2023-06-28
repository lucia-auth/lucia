import type { MarkdownInstance } from "astro";

const collectionImports = import.meta.glob("../../content/**");

export type Page = {
	pathname: string;
	collectionId: string;
	subCollectionId: string | null;
	pageId: string | null;
	order: number | null;
	title: string;
	htmlMenuTitle: string;
	htmlTitle: string;
	hidden: boolean;
	description: string | null;
	Content: MarkdownInstance<any>["Content"];
};

export type SubCollection = {
	pathname: string;
	collectionId: string;
	subCollectionId: string | null;
	order: number | null;
	title: string;
	htmlTitle: string;
	pages: Page[];
};

const parseMarkdownCode = (text: string) => {
	return text.replace("`", "<code>").replace("`", "</code>");
};

const removeMarkdownCode = (text: string) => {
	return text.replaceAll("`", "");
};

const readImportPath = (importPath: string) => {
	const sanitizedPathname = importPath
		.split("/")
		.filter((segment) => segment !== ".." && segment !== "." && segment)
		.slice(1)
		.join("/")
		.replace(/\.md(?!\.md)/, "")
		.replace(/\.json(?!\.json)/, "")
		.replace(/\/index$/, "");
	const sanitizedPathnameSegments = sanitizedPathname.split("/");
	const collectionId = sanitizedPathnameSegments.at(0) ?? null;
	if (!collectionId) {
		throw new Error(`Invalid pathname: ${sanitizedPathnameSegments.join("/")}`);
	}

	const parsePathnameSegment = (
		segment: string | null
	): [null | string, null | number] => {
		if (!segment) return [null, null];
		if (segment.split(".").length === 1) {
			return [segment.split(".")[0], null];
		}
		const [orderStr, name] = segment.split(".");
		return [name, Number(orderStr)];
	};
	const [subCollectionId, subCollectionOrder] = parsePathnameSegment(
		sanitizedPathnameSegments.at(1) ?? null
	);
	const [pageId, pageOrder] = parsePathnameSegment(
		sanitizedPathnameSegments.slice(2).join("/") ?? null
	);
	const pathname = [collectionId, subCollectionId, pageId]
		.filter((val): val is string => !!val)
		.join("/");
	return {
		pathname,
		collectionId,
		pageId,
		pageOrder,
		subCollectionId,
		subCollectionOrder
	};
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
	const { pathname, pageOrder, subCollectionId, collectionId, pageId } =
		readImportPath(importPath);
	const pathnameSegments = pathname.split("/");
	const markdown: MarkdownInstance<{
		title: string;
		menuTitle?: string;
		hidden?: boolean;
		description?: string;
	}> = await resolveImport();
	const rawTitle = markdown.frontmatter.title;
	const title = removeMarkdownCode(rawTitle);
	const htmlTitle = parseMarkdownCode(rawTitle);
	const htmlMenuTitle = parseMarkdownCode(
		markdown.frontmatter.menuTitle ?? rawTitle
	);
	return {
		pathname,
		description: markdown.frontmatter.description ?? null,
		collectionId,
		subCollectionId,
		pageId,
		order: pageOrder,
		title,
		hidden:
			pathnameSegments.length > 3 ? true : markdown.frontmatter.hidden ?? false,
		htmlTitle,
		htmlMenuTitle,
		Content: markdown.Content
	};
};

export const getSubCollections = async (
	collectionId: "main" | "reference" | "oauth"
): Promise<SubCollection[]> => {
	const selectedCollectionImports = Object.fromEntries(
		Object.entries(collectionImports).filter(([importPath]) => {
			const { pathname } = readImportPath(importPath);
			return pathname.split("/").at(0) === collectionId;
		})
	);
	const subCollectionConfigs = await Promise.all(
		Object.entries(selectedCollectionImports)
			.filter(([importPath]) => importPath.endsWith(".json"))
			.map(async ([importPath, importFile]) => {
				const { pathname, subCollectionOrder, subCollectionId, collectionId } =
					readImportPath(importPath);
				const parsedJson = (await importFile()) as {
					title: string;
					format?: "code";
				};
				const htmlTitle =
					parsedJson.format === "code"
						? parseMarkdownCode(parsedJson.title)
						: parsedJson.title;
				return {
					pathname,
					collectionId,
					subCollectionId,
					order: subCollectionOrder,
					title: parsedJson.title,
					htmlTitle
				} satisfies Omit<SubCollection, "pages">;
			})
	);

	const pages = await getPagesFromImports(selectedCollectionImports);

	return subCollectionConfigs
		.map((subCollectionConfig) => {
			return {
				...subCollectionConfig,
				pages: pages
					.filter((page) => {
						return page.subCollectionId === subCollectionConfig.subCollectionId;
					})
					.sort((a, b) => (a.order ?? -1) - (b.order ?? -1))
			};
		})
		.sort((a, b) => (a.order ?? -1) - (b.order ?? -1));
};

export const getPage = async (...path: string[]) => {
	const targetPathname = path.join("/");
	const targetImportEntry = Object.entries(collectionImports).find(
		([importPath]) => {
			return readImportPath(importPath).pathname === targetPathname;
		}
	);
	if (!targetImportEntry) throw new Error(`Not found: ${targetPathname}`);
	const [importPath, resolveImport] = targetImportEntry;
	return await transformMarkdownImport(importPath, resolveImport);
};

export const getPages = async (...path: string[]) => {
	const targetPathname = path.join("/");
	const pagesImportEntries = Object.entries(collectionImports).filter(
		([importPath]) => {
			const pagePathname = readImportPath(importPath).pathname;
			return (
				pagePathname !== targetPathname &&
				pagePathname
					.split("/")
					.slice(0, targetPathname.split("/").length)
					.join("/") === targetPathname
			);
		}
	);
	const pages = await Promise.all(
		pagesImportEntries.map(([importPath, resolveImport]) => {
			return transformMarkdownImport(importPath, resolveImport);
		})
	);
	return pages;
};
