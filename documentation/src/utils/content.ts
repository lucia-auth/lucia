import type { MarkdownInstance } from "astro";

const markdownImports = Object.entries(
	import.meta.glob<
		MarkdownInstance<{
			title: string;
			description?: string;
			hidden?: boolean;
		}>
	>("../../content/**/*.md")
).map(([importPath, resolve]) => {
	return [
		importPath
			.replace("../../content/", "")
			.replace(".md", "")
			.replace("/index", ""),
		resolve
	] as const;
});

type ChildPage = {
	htmlTitle: string;
	href: string;
};

export type Page = {
	pathname: string;
	href: string;
	collectionId: string;
	title: string;
	htmlTitle: string;
	hidden: boolean;
	description: string | null;
	childPages: ChildPage[];
	Content: MarkdownInstance<any>["Content"];
};

const parseMarkdownCode = (text: string) => {
	let result = text;
	while (result.includes("`")) {
		result = result.replace("`", "<code>").replace("`", "</code>");
	}
	return result;
};

const removeMarkdownCode = (text: string) => {
	return text.replaceAll("`", "");
};

export const getPages = async (collectionId: string): Promise<Page[]> => {
	const targetImports = markdownImports.filter(([pathname]) => {
		return pathname.startsWith(collectionId + "/") || pathname === collectionId;
	});
	return await Promise.all(
		targetImports.map(async ([pathname, resolve]): Promise<Page> => {
			const resolvedFile = await resolve();
			return {
				pathname,
				href: getHrefFromContentPathname(pathname),
				collectionId,
				title: removeMarkdownCode(resolvedFile.frontmatter.title),
				htmlTitle: parseMarkdownCode(resolvedFile.frontmatter.title),
				description: resolvedFile.frontmatter.description ?? null,
				hidden: Boolean(resolvedFile.frontmatter.hidden),
				childPages: [],
				Content: resolvedFile.Content
			};
		})
	);
};

const getHrefFromContentPathname = (pathname: string) => {
	if (pathname.startsWith("main/")) {
		return pathname.replace("main/", "/");
	}
	return "/" + pathname;
};
