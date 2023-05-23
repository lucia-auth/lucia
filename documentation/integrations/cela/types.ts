import type { FrameworkId } from "src/utils/framework";
import type { getContent } from "./content";

export type SectionDocument = {
	rawTitle: string;
	id: string;
	pathname: string;
	order: number;
};

export type Section = {
	rawTitle: string;
	order: number;
	documents: SectionDocument[];
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
	frameworkId: FrameworkId | null;
	redirect: string | null;
	rawTitle: string;
	id: string;
	pathname: string;
	description: string | null;
	rawSubCollectionTitle: string;
};

export type ContentLink = {
	metaData: ContentMetaData;
	mappedContentPath: string;
	headings: ContentLinkHeading[];
};

export type ContentLinkHeading = {
	rawText: string;
	hash: string;
	depth: number;
};
