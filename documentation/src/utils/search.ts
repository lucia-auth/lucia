import { getBuildId } from "./build";

export const queryContent = async (
	query: string
): Promise<QueryResultPage[]> => {
	const pages = await promise;
	const keywords = query.split(" ").filter((val) => Boolean(val));
	const matchedPages: QueryResultPage[] = [];
	for (const page of pages) {
		const matchedHeadings = page.headings.filter((heading) => {
			return match(heading.title, keywords);
		});
		if (
			match(page.title, keywords) ||
			match(page.description ?? "", keywords) ||
			matchedHeadings.length > 0
		) {
			matchedPages.push({
				title: page.title,
				description: page.description,
				href: page.href,
				headings: matchedHeadings
			});
		}
	}
	return matchedPages;
};

const getRawContent = async (): Promise<string> => {
	const buildId = getBuildId();
	const cacheKey = localStorage.getItem("search:cache_key");
	if (buildId === cacheKey) {
		const storedContent = localStorage.getItem("search:content");
		if (storedContent !== null) return storedContent;
		localStorage.removeItem("search:cache_key");
	} else {
		localStorage.setItem("search:cache_key", buildId);
		localStorage.removeItem("search:content");
	}
	const response = await fetch("/content.txt");
	if (!response.ok) {
		throw new Error(`Server returned status ${response.status}`);
	}
	const result = await response.text();
	localStorage.setItem("search:content", result);
	return result;
};

const promise = new Promise<QueryResultPage[]>(async (resolve, reject) => {
	try {
		const rawContent = await getRawContent();
		const rawItems = rawContent.split("|");
		const result: QueryResultPage[] = [];
		for (let index = 0; index < rawItems.length; index += 4) {
			const [title, href, description, rawHeadings] = rawItems.slice(
				index,
				index + 4
			);
			let headings: QueryResultHeading[] = [];
			if (rawHeadings) {
				headings = rawHeadings.split("\\").map((rawHeadingItem) => {
					const [headingHash, ...headingTitleSections] =
						rawHeadingItem.split(":");
					return {
						title: headingTitleSections.join(":"),
						hash: headingHash
					};
				});
			}
			result.push({
				title,
				href,
				description: description || null,
				headings
			});
		}
		return resolve(result);
	} catch (e) {
		return reject(e);
	}
});

const match = (target: string, keywords: string[]): boolean => {
	if (keywords.length < 1) return false;
	for (const keyword of keywords) {
		if (target.toLowerCase().includes(keyword.toLowerCase())) continue;
		return false;
	}
	return true;
};

type QueryResultHeading = {
	title: string;
	hash: string;
};
type QueryResultPage = {
	title: string;
	description: string | null;
	href: string;
	headings: QueryResultHeading[];
};
