import type { GetStaticPaths, MarkdownInstance } from "astro";

export const getSections = async (
	configGlob: ConfigGlob,
	pageGlob: MarkdownInstance<{
		title: string;
		order: number;
		redirect?: string;
	}>[]
): Promise<Section[]> => {
	const renderedConfigs = await Promise.all(
		Object.entries(configGlob).map(async ([configUrl, render]) => {
			const json = await render();
			return {
				order: json.order,
				title: json.title,
				configUrl
			};
		})
	);
	return Promise.all(
		renderedConfigs
			.sort((a, b) => a.order - b.order) // sort by order attribute
			.map(async (section) => {
				const relevantPageGlob = pageGlob
					.filter((doc) => doc.file.includes(section.configUrl.replace("config.json", "")))
					.sort((a, b) => a.frontmatter.order - b.frontmatter.order); // sort by order attribute
				const pages = await getPages(relevantPageGlob);
				return {
					title: section.title,
					pages
				} satisfies Section;
			})
	);
};

export const getPages = async (
	documentGlob: MarkdownInstance<{
		title: string;
		order: number;
		redirect?: string;
	}>[]
): Promise<Page[]> => {
	return documentGlob
		.sort((a, b) => a.frontmatter.order - b.frontmatter.order) // sort by order attribute
		.map((doc) => {
			const docAttributes = doc.frontmatter;
			/* 
			gets relative path from absolute markdown file path
			/lucia-auth/documentation/content/learn/start-here/introduction.md
			=> learn/start-here/introduction
		 	*/
			const urlMatcher = /.+\/documentation\/content\/(.*)\.md/;
			const path = docAttributes.redirect ?? `/${doc.file.match(urlMatcher)?.[1] ?? ""}`;
			return {
				title: docAttributes.title,
				redirect: docAttributes.redirect ?? null,
				Content: doc.Content,
				path,
				getHeadings: doc.getHeadings
			};
		});
};

export const getStaticPathsFromPageGlob = async (
	pageGlob: MarkdownInstance<{
		title: string;
		order: number;
		redirect?: string;
	}>[]
) => {
	const pages = await getPages(pageGlob);
	return pages.map((page) => {
		return {
			params: {
				/*
					/learn/start-here/introduction
					=> split: [ <empty>, "learn", "start-here", "introduction" ]
					=> slice+join: start-here/introduction
					*/
				path: page.path.split("/").slice(2).join("/")
			},
			props: {
				page
			}
		};
	});
};

export type ConfigGlob = Record<
	any,
	() => Promise<{
		order: number;
		title: string;
	}>
>;

export type Content = {
	title: string;
	id: string;
	sections: Section[];
};

export type Section = {
	title: string;
	pages: Page[];
};

export type Page = {
	title: string;
	redirect: string | null;
	Content: MarkdownInstance<any>["Content"];
	path: string;
	getHeadings: MarkdownInstance<any>["getHeadings"];
};
