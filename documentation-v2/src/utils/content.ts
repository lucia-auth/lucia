import type { MarkdownInstance } from "astro";

const collectionImports = import.meta.glob("../../content/**");

export type Page = {
	pathname: string;
	pathnameSegments: string[];
	pathnameSegmentOrders: (number | null)[];
	collectionId: string;
	title: string;
	htmlMenuTitle: string;
	htmlTitle: string;
	hidden: boolean;
	description: string | null;
	Content: MarkdownInstance<any>["Content"];
};

export type SubCollection = {
	pathname: string;
	pathnameSegments: string[];

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
	const filePathnameSegments = importPath
		.split("/")
		.filter((segment) => segment !== ".." && segment !== "." && segment)
		.slice(1);
	const collectionId = filePathnameSegments.at(0) ?? null;

	if (!collectionId) {
		throw new Error(`Invalid pathname: ${filePathnameSegments.join("/")}`);
	}

	const pathnameSegments: string[] = [];
	const pathnameSegmentOrders: (number | null)[] = [];

	for (const [segmentIndex, segment] of filePathnameSegments.entries()) {
		const lastSegment = segmentIndex === filePathnameSegments.length - 1;
		if (lastSegment && segment === "$.json") {
			continue;
		}

		const getMarkdownFileName = (fileName: string) => {
			return fileName.replace(/\.md(?!\.md)/, "");
		};

		const parsedSegment = lastSegment ? getMarkdownFileName(segment) : segment;
		const parts = parsedSegment.split(".");

		let name: string;
		if (parts.length === 1) {
			name = parts[0];
			pathnameSegmentOrders.push(null);
		} else {
			name = parts[1];
			const order = Number(parts[0]);
			pathnameSegmentOrders.push(order);
		}

		if (name !== "index") {
			pathnameSegments.push(name);
		}
	}

	const pathname = pathnameSegments.join("/");
	return {
		pathname,
		pathnameSegments,
		collectionId,
		pathnameSegmentOrders
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
): Promise<Page> => {
	const { pathname, pathnameSegments, collectionId, pathnameSegmentOrders } =
		readImportPath(importPath);
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
		pathnameSegments,
		pathnameSegmentOrders,
		description: markdown.frontmatter.description ?? null,
		collectionId,
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
			const { pathnameSegments } = readImportPath(importPath);
			return pathnameSegments.at(0) === collectionId;
		})
	);
	const subCollectionConfigs = await Promise.all(
		Object.entries(selectedCollectionImports)
			.filter(([importPath]) => importPath.endsWith(".json"))
			.map(
				async ([importPath, importFile]): Promise<
					Omit<SubCollection, "pages">
				> => {
					const { pathnameSegmentOrders, pathname, pathnameSegments } =
						readImportPath(importPath);
					const subCollectionId = pathnameSegments.at(1) ?? null;

					if (!subCollectionId) {
						throw new Error(`Invalid sub-collection: ${pathname}`);
					}

					const subCollectionOrder = pathnameSegmentOrders.at(2) ?? null;
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
						pathnameSegments,
						collectionId,
						subCollectionId,
						order: subCollectionOrder,
						title: parsedJson.title,
						htmlTitle
					};
				}
			)
	);

	const pages = await getPagesFromImports(selectedCollectionImports);

	return subCollectionConfigs
		.map((subCollectionConfig) => {
			return {
				...subCollectionConfig,
				pages: pages
					.filter((page) => {
						const subCollectionId = page.pathnameSegments.at(1) ?? null;
						return subCollectionId === subCollectionConfig.subCollectionId;
					})
					.sort((a, b) => {
						const aOrder = a.pathnameSegmentOrders.at(2) ?? -1;
						const bOrder = b.pathnameSegmentOrders.at(2) ?? -1;
						return aOrder - bOrder;
					})
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
			const { pathname, pathnameSegments } = readImportPath(importPath);
			return (
				pathname !== targetPathname &&
				pathnameSegments
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
