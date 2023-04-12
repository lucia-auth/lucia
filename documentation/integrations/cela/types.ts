import type { getContent } from "./content";

export type Section = {
	title: string;
	order: number;
	documents: {
		id: string;
		title: string;
		href: string;
		order: number;
	}[];
	id: string;
};

export type Collection = {
	id: string;
	title: string;
	sections: Section[];
};

export type MarkdownDocument = Exclude<
	Awaited<ReturnType<typeof getContent>>,
	null
>;

export type ContentMetaData = {
	collectionId: string;
	frameworkId: string | null;
	redirect: string | null;
	title: string;
	id: string;
	href: string;
	description: string | null;
};

export type ContentLink = {
	metaData: ContentMetaData;
	mappedContentPath: string;
};
