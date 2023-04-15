import type { HeadingIndex, TitleIndex } from "./generate";
import { removeMarkdownFormatting } from "../integrations/markdown";

type Indexes = {
	titles: TitleIndex[];
	headings: HeadingIndex[];
};

export type QueryResultItem = {
	title: TitleIndex;
	headings: HeadingIndex[];
};

export const initializeSearch = () => {
	const importIndexesPromise = new Promise<Indexes>(async (resolve) => {
		const indexes: Indexes = (await import(".search.json")) as any;
		resolve(indexes);
	});
	importIndexesPromise;

	const callbacks: ((result: QueryResultItem[], queryInput: string) => void)[] =
		[];
	const setQueryResult = (result: QueryResultItem[], queryInput: string) => {
		for (const callback of callbacks) {
			callback(result, queryInput);
		}
		return result;
	};
	const clientQuery = async (
		queryInput: string,
		frameworkId: string | null
	): Promise<QueryResultItem[]> => {
		const indexes = await importIndexesPromise;
		const result = await query(indexes, queryInput, frameworkId);
		return setQueryResult(result, queryInput);
	};

	const onQueryResult = (
		callback: (result: QueryResultItem[], queryInput: string) => void
	) => {
		callbacks.push(callback);
	};
	return [clientQuery, onQueryResult] as const;
};

const getMissingKeywords = (textChunks: string[], keywords: string[]) => {
	return keywords.filter((keyword) => {
		return !textChunks.some((textChunk) => {
			return textChunk.toLowerCase().includes(keyword);
		});
	});
};

const getQueryKeywords = (
	queryInput: string
): [keywords: string[], collectionId: string | null] => {
	const keywords = queryInput
		.toLowerCase()
		.split(" ")
		.filter((val) => !!val);
	const firstChunk = keywords.at(0) ?? null;
	if (firstChunk === null) return [[], null];
	if (!firstChunk.startsWith(":")) return [keywords, null];
	keywords.shift();
	return [keywords, firstChunk.replace(":", "")];
};

export const query = async (
	indexes: Indexes,
	queryInput: string,
	frameworkId: string | null
) => {
	const [queryKeywords, collectionIdFilter] = getQueryKeywords(queryInput);
	if (queryKeywords.length < 1 && collectionIdFilter === null) {
		return [];
	}
	const titleIndexesMap = new Map<string, TitleIndex>();
	const matchedTitleIndexMap = new Map<string, TitleIndex>();
	for (const titleIndex of indexes.titles) {
		titleIndexesMap.set(titleIndex.pathname, titleIndex);
		if (
			titleIndex.frameworkId !== null &&
			titleIndex.frameworkId !== frameworkId
		)
			continue;
		if (
			collectionIdFilter &&
			!titleIndex.collectionId.startsWith(collectionIdFilter)
		)
			continue;
		const targetTextChunks = removeMarkdownFormatting(titleIndex.rawText)
			.toLowerCase()
			.split(" ");
		const subCollectionTextChunks = removeMarkdownFormatting(
			titleIndex.rawSubCollectionTitle
		)
			.toLowerCase()
			.split(" ");
		targetTextChunks.push(...subCollectionTextChunks);
		const missingKeywords = getMissingKeywords(targetTextChunks, queryKeywords);
		if (missingKeywords.length > 0) continue;
		const storedIndex = matchedTitleIndexMap.get(titleIndex.pathname) ?? null;
		if (storedIndex) {
			if (!storedIndex) throw new Error();
			if (storedIndex.frameworkId !== null) continue;
		}
		matchedTitleIndexMap.set(titleIndex.pathname, titleIndex);
	}
	const matchedHeadingIndexMap = new Map<string, HeadingIndex[]>();
	for (const headingIndex of indexes.headings) {
		if (
			headingIndex.frameworkId !== null &&
			headingIndex.frameworkId !== frameworkId
		)
			continue;

		let parentTitleIndex =
			matchedTitleIndexMap.get(headingIndex.pathname) ?? null;
		if (!parentTitleIndex) {
			const titleIndex = titleIndexesMap.get(headingIndex.pathname);
			if (!titleIndex) throw new Error();
			parentTitleIndex = titleIndex;
		}
		if (
			collectionIdFilter &&
			!parentTitleIndex.collectionId.startsWith(collectionIdFilter)
		)
			continue;
		if (headingIndex.frameworkId !== parentTitleIndex.frameworkId) continue;
		const headingTextChunks = removeMarkdownFormatting(headingIndex.rawText)
			.toLowerCase()
			.split(" ");
		const missingKeywords = getMissingKeywords(
			headingTextChunks,
			queryKeywords
		);
		if (missingKeywords.length === queryKeywords.length) continue;
		if (missingKeywords.length > 0) {
			const targetTextChunks = removeMarkdownFormatting(
				parentTitleIndex.rawText
			)
				.toLowerCase()
				.split(" ");
			const subCollectionTextChunks = removeMarkdownFormatting(
				parentTitleIndex.rawSubCollectionTitle
			)
				.toLowerCase()
				.split(" ");
			targetTextChunks.push(...subCollectionTextChunks);
			const titleMissingKeywords = getMissingKeywords(
				targetTextChunks,
				missingKeywords
			);
			if (titleMissingKeywords.length > 0) continue;
		}
		if (missingKeywords.length > 0) continue;
		const headingIndexes =
			matchedHeadingIndexMap.get(headingIndex.pathname) ?? [];
		headingIndexes.push(headingIndex);
		matchedHeadingIndexMap.set(headingIndex.pathname, headingIndexes);
		if (!matchedTitleIndexMap.has(parentTitleIndex.pathname)) {
			matchedTitleIndexMap.set(parentTitleIndex.pathname, parentTitleIndex);
		}
	}
	const result = [...matchedTitleIndexMap.values()]
		.map((titleIndex) => {
			const headingIndexes =
				matchedHeadingIndexMap.get(titleIndex.pathname) ?? [];
			return {
				title: titleIndex,
				headings: headingIndexes
			};
		})
		.sort((a, b) => a.title.collectionId.localeCompare(b.title.collectionId));
	return result;
};
