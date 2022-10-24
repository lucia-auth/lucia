import type { MarkdownInstance } from "astro";

type Section = {
	id: string;
	title: string;
	order: number;
};

type Page = {
	title: string;
	sectionId: string;
	order: number;
	url: string;
};

export const getContent = (sections: Section[], pages: Page[]): Content => {
	return sections.map((section) => {
		return {
			title: section.title,
			id: section.id,
			pages: pages
				.filter((page) => section.id === page.sectionId)
				.sort((a, b) => {
					const orderSort = a.order - b.order;
					if (orderSort !== 0) return a.order - b.order;
					return a.title.localeCompare(b.title);
				})
				.map((page) => {
					return {
						title: page.title,
						url: page.url
					};
				})
		};
	});
};

type MarkdownProps = {
	title: string;
	order: number;
};

export const getSections = (
	markdownDocs: MarkdownInstance<MarkdownProps>[],
	name: string
): Section[] => {
	return markdownDocs
		.map((doc) => {
			const matches = doc.url?.match(new RegExp(`^\\/${name}\\/(.*)`)) || [];
			return {
				id: matches[1],
				title: doc.frontmatter.title,
				order: doc.frontmatter.order
			};
		})
		.sort((a, b) => a.order - b.order);
};

export const getPages = (markdownDocs: MarkdownInstance<MarkdownProps>[], name: string): Page[] => {
	return markdownDocs.map((doc) => {
		const sectionIdMatches = doc.url?.match(new RegExp(`^\\/${name}\\/(?!index\\.md)(.*)\/`)) || [];
		return {
			sectionId: sectionIdMatches[1],
			title: doc.frontmatter.title,
			url: doc.url || "",
			order: doc.frontmatter.order
		};
	});
};
