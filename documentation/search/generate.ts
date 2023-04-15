import fs from "fs";
import path from "path";
import { CELA_GENERATED_DIR } from "../integrations/cela/constant";
import type { ContentLink } from "@cela/types";

export type TitleIndex = {
	rawText: string;
	pathname: string;
	frameworkId: string | null;
	collectionId: string;
	rawSubCollectionTitle: string;
};

export type HeadingIndex = {
	rawText: string;
	pathname: string;
	hash: string;
	frameworkId: string | null;
};

export const generateSearchIndex = () => {
	const generatedLinkFileNames = fs.readdirSync(
		path.join(CELA_GENERATED_DIR, "content")
	);
	const titleIndexes: TitleIndex[] = [];
	const headingIndexes: HeadingIndex[] = [];
	for (const generatedLinkFileName of generatedLinkFileNames) {
		const file = fs.readFileSync(
			path.join(CELA_GENERATED_DIR, "content", generatedLinkFileName)
		);
		const contentLink = JSON.parse(file.toString()) as ContentLink;
		titleIndexes.push({
			rawText: contentLink.metaData.rawTitle,
			pathname: contentLink.metaData.pathname,
			frameworkId: contentLink.metaData.frameworkId,
			collectionId: contentLink.metaData.collectionId,
			rawSubCollectionTitle: contentLink.metaData.rawSubCollectionTitle
		});
		for (const heading of contentLink.headings) {
			headingIndexes.push({
				rawText: heading.rawText,
				pathname: contentLink.metaData.pathname,
				hash: heading.hash,
				frameworkId: contentLink.metaData.frameworkId
			});
		}
	}
	fs.writeFileSync(
		path.join(process.cwd(), ".search.json"),
		JSON.stringify({
			titles: titleIndexes,
			headings: headingIndexes
		})
	);
};
