import { frameworkIds } from "@utils/framework";
import {
	CELA_GENERATED_DIR,
	contentImports,
	collectionImports,
	generatedLinksImports
} from "./constant";

export const getContent = async (
	contentPath: string,
	frameworkId: string | null = null
) => {
	const getLink = async () => {
		const generatedLinksImportsKey = `${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
			"/",
			"_"
		)}.json`;
		const resolveBaseLink =
			generatedLinksImports[generatedLinksImportsKey] ?? null;
		if (frameworkId) {
			const resolveModifiedLink =
				generatedLinksImports[
					`${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
						"/",
						"_"
					)}.${frameworkId}.json`
				] ?? null;
			if (resolveModifiedLink) return await resolveModifiedLink();
		}
		if (resolveBaseLink) return await resolveBaseLink();
		for (const possibleFrameworkId of frameworkIds) {
			if (possibleFrameworkId === frameworkId) continue;
			const importKey = `${CELA_GENERATED_DIR}/content/${contentPath.replaceAll(
				"/",
				"_"
			)}.${possibleFrameworkId}.json`;
			const resolveLink = generatedLinksImports[importKey] ?? null;
			if (!resolveLink) continue;
			return await resolveLink();
		}
		return null;
	};
	const readContentFile = async (importKey: string) => {
		const resolveContent = contentImports[importKey] ?? null;
		if (!resolveContent) return null;
		return resolveContent();
	};
	const contentLink = await getLink();
	if (!contentLink) return null;
	const content = await readContentFile(contentLink.mappedContentPath);
	if (!content) return null;
	return {
		metaData: contentLink.metaData,
		Content: content.Content,
		headings: contentLink.headings,
		mappedContentPath: contentLink.mappedContentPath
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
