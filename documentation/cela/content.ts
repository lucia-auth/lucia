import { frameworkIds } from "@lib/framework";
import {
	CELA_GENERATED_DIR,
	contentImports,
	collectionImports
} from "./constant";

export const getContent = async (
	contentPath: string,
	requestedFrameworkId: string | null = null
) => {
	const readContentFile = async () => {
		const contentImportsKey = `${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
			"/",
			"_"
		)}.md`;
		const resolveBaseContent = contentImports[contentImportsKey] ?? null;
		const filteredFrameworkId =
			requestedFrameworkId === "none" ? null : requestedFrameworkId;
		if (filteredFrameworkId) {
			const resolveModifiedContent =
				contentImports[
					`${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
						"/",
						"_"
					)}.${filteredFrameworkId}.md`
				] ?? null;
			if (resolveModifiedContent) return await resolveModifiedContent();
		}
		if (resolveBaseContent) return await resolveBaseContent();
		for (const validFrameworkId of frameworkIds) {
			if (validFrameworkId === "none") continue;
			const resolveContent =
				contentImports[
					`${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
						"/",
						"_"
					)}.${validFrameworkId}.md`
				] ?? null;
			if (resolveContent) return await resolveContent();
		}
		return null;
	};
	const contentFile = await readContentFile();
	if (!contentFile) return null;
	return {
		metaData: contentFile.frontmatter,
		Content: contentFile.Content,
		headings: contentFile.getHeadings()
	} as const;
};

export const getCollection = async (
	collectionId: string,
	frameworkId: string | null
) => {
	const readCollectionFile = async () => {
		const collectionKey = frameworkId
			? [collectionId, frameworkId].join(".")
			: collectionId;
		const collectionImportsKey = `${CELA_GENERATED_DIR}/collections/${collectionKey}.json`;
		const resolveCollections = collectionImports[collectionImportsKey] ?? null;
		if (resolveCollections) return await resolveCollections();
		const baseCollectionImportKey = `${CELA_GENERATED_DIR}/collections/${collectionId}.json`;
		const resolveBaseContent =
			collectionImports[baseCollectionImportKey] ?? null;
		if (resolveBaseContent) return await resolveBaseContent();
		return null;
	};
	const collectionFile = await readCollectionFile();
	if (!collectionFile) return null;
	return collectionFile.default;
};
