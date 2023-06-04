import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CELA_GENERATED_DIR } from "./constant";
import { removeMarkdownFormatting } from "./../markdown";

import type {
	Collection,
	ContentMetaData,
	ContentLink,
	Section,
	SectionDocument,
	ContentLinkHeading
} from "./types";
import type { FrameworkId } from "@utils/framework";

const getCollectionPath = (...pathSegments: string[]) => {
	return path.join(process.cwd(), "content", ...pathSegments);
};

const generatedContentDirPath = path.join(
	process.cwd(),
	CELA_GENERATED_DIR,
	"content"
);

const generatedCollectionsDirPath = path.join(
	process.cwd(),
	CELA_GENERATED_DIR,
	"collections"
);

export const generateContent = () => {
	const baseCollectionPath = getCollectionPath();
	const collectionIds = fs.readdirSync(baseCollectionPath);
	const generatedDirPath = path.join(
		process.cwd(),
		CELA_GENERATED_DIR,
		"content"
	);

	if (fs.existsSync(generatedDirPath)) {
		fs.rmSync(generatedDirPath, {
			recursive: true
		});
	}

	fs.mkdirSync(generatedContentDirPath, {
		recursive: true
	});
	fs.mkdirSync(generatedCollectionsDirPath, {
		recursive: true
	});

	for (const collectionId of collectionIds) {
		generateCollection(collectionId);
	}
};

const sortItems = (a: { rawTitle: string; order?: number }, b: typeof a) => {
	if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
	return removeMarkdownFormatting(a.rawTitle).localeCompare(
		removeMarkdownFormatting(b.rawTitle)
	);
};

export const generateCollection = (collectionId: string) => {
	const getId = (fsName: string) => {
		const [id, framework] = fsName.replace(".md", "").split(".") as [
			string,
			undefined | string
		];
		return [id, framework ?? null] as const;
	};

	const generatedCollectionDirPath = path.join(
		generatedContentDirPath,
		collectionId
	);
	if (fs.existsSync(generatedCollectionDirPath)) {
		fs.rmSync(generatedCollectionDirPath, {
			recursive: true
		});
	}

	const collectionPath = getCollectionPath(collectionId);
	if (!fs.lstatSync(collectionPath).isDirectory()) return;
	const subCollectionFsNames = fs.readdirSync(collectionPath);
	const baseSections: Section[] = [];
	const frameworkSectionsMap: Record<string, Section[]> = {};

	const collectionConfigJsonPath = getCollectionPath(collectionId, "_.json");
	if (!fs.existsSync(collectionConfigJsonPath))
		throw new Error(`Does not exist: ${collectionConfigJsonPath}`);
	const collectionConfigJson = fs.readFileSync(collectionConfigJsonPath);
	const collectionConfig = JSON.parse(collectionConfigJson.toString());
	const collectionTitle = String(collectionConfig.title);

	for (const subCollectionFsName of subCollectionFsNames) {
		const subCollectionPath = getCollectionPath(
			collectionId,
			subCollectionFsName
		);
		if (!fs.lstatSync(subCollectionPath).isDirectory()) continue;
		const [subCollectionId, subCollectionFramework] =
			getId(subCollectionFsName);
		const documentFsNames = fs.readdirSync(subCollectionPath);
		const subCollectionConfigJsonPath = getCollectionPath(
			collectionId,
			subCollectionFsName,
			"_.json"
		);
		if (!fs.existsSync(subCollectionConfigJsonPath))
			throw new Error(`Does not exist: ${subCollectionConfigJsonPath}`);
		const subCollectionConfigJson = fs.readFileSync(
			subCollectionConfigJsonPath
		);
		const subCollectionConfig = JSON.parse(subCollectionConfigJson.toString());
		const subCollectionOrder = Number(subCollectionConfig._order ?? -1);
		const subCollectionTitle = String(subCollectionConfig.title);
		const baseSection: Section = {
			order: subCollectionOrder,
			rawTitle: subCollectionTitle,
			documents: [],
			id: subCollectionId
		};
		const frameworkSectionMap: Record<string, Section> = subCollectionFramework
			? {
					[subCollectionFramework]: {
						rawTitle: subCollectionTitle,
						order: subCollectionOrder,
						documents: [],
						id: subCollectionId
					}
			  }
			: {};

		for (const documentFsName of documentFsNames) {
			const documentPath = getCollectionPath(
				collectionId,
				subCollectionFsName,
				documentFsName
			);
			if (!fs.lstatSync(documentPath).isFile()) continue;
			if (!documentPath.endsWith(".md")) continue;
			const basePathSegment = collectionId === "main" ? "" : collectionId;
			const [documentId, documentFramework] = getId(documentFsName);
			const frameworkId = subCollectionFramework ?? documentFramework;
			const documentHref = `/${path.join(
				basePathSegment,
				subCollectionId,
				documentId
			)}`;
			const documentFsUrl = frameworkId
				? `/${path.join(
						basePathSegment,
						subCollectionId,
						[documentId, frameworkId].join(".")
				  )}`
				: documentHref;
			const rawDocumentFile = fs.readFileSync(documentPath);
			const frontmatterResult = matter(rawDocumentFile);
			const frontmatterData = frontmatterResult.data as Partial<{
				title: string;
				description: string;
				_redirect: string;
			}>;
			if (frontmatterData.title === undefined) {
				throw new Error(
					`Property "title" is undefined at: ${documentFsUrl} : ${
						frameworkId ?? "-"
					}`
				);
			}
			const contentMetaData = {
				rawTitle: frontmatterData.title,
				redirect: frontmatterData._redirect ?? null,
				collectionId,
				rawSubCollectionTitle: subCollectionTitle,
				frameworkId: frameworkId as FrameworkId | null,
				id: documentId,
				pathname: documentHref,
				description: frontmatterData.description ?? null
			} satisfies ContentMetaData;

			const extractedHeadings = frontmatterResult.content
				.replace(/```[\s\S]*?```/g, "")
				.split("\n")
				.filter((chunk) => chunk.startsWith("#"));

			const headings = extractedHeadings
				.map((heading): ContentLinkHeading => {
					const [headingPrefix, ...titleChunks] = heading.split(" ");
					const rawText = titleChunks.join(" ");
					return {
						depth: headingPrefix.length,
						rawText,
						hash: `#${rawText
							.replaceAll(" ", "-")
							.toLocaleLowerCase()
							.replace(/[^a-z0-9-]/gi, "")}`
					};
				})
				.filter((heading) => heading.depth < 4);
			const generatedContentLink: ContentLink = {
				metaData: contentMetaData,
				mappedContentPath: documentPath.replace(process.cwd(), ""),
				headings
			};

			fs.writeFileSync(
				path.join(
					generatedContentDirPath,
					[documentFsUrl.replaceAll("/", "_"), "json"].join(".")
				),
				JSON.stringify(generatedContentLink)
			);
			const doc = {
				rawTitle: frontmatterResult.data.title,
				pathname: documentHref,
				order: frontmatterResult.data._order ?? -1,
				id: documentId
			} satisfies SectionDocument;
			if (!frameworkId) {
				baseSection.documents.push(doc);
				continue;
			}
			if (!(frameworkId in frameworkSectionMap)) {
				frameworkSectionMap[frameworkId] = {
					rawTitle: subCollectionTitle,
					order: subCollectionOrder,
					documents: [],
					id: subCollectionId
				};
			}
			frameworkSectionMap[frameworkId].documents.push(doc);
		}
		if (!subCollectionFramework) {
			baseSection.documents = baseSection.documents.sort(sortItems);
			baseSections.push(baseSection);
		}
		for (const framework in frameworkSectionMap) {
			if (!(framework in frameworkSectionsMap)) {
				frameworkSectionsMap[framework] = [];
			}
			const uniqueBaseSectionDocuments = baseSection.documents.filter(
				(baseSectionDoc) => {
					return !frameworkSectionMap[framework].documents.some(
						(frameworkDoc) => frameworkDoc.id === baseSectionDoc.id
					);
				}
			);
			frameworkSectionMap[framework].documents = [
				...frameworkSectionMap[framework].documents,
				...uniqueBaseSectionDocuments
			].sort(sortItems);
			frameworkSectionsMap[framework].push(frameworkSectionMap[framework]);
		}
	}
	fs.writeFileSync(
		path.join(generatedCollectionsDirPath, [collectionId, "json"].join(".")),
		JSON.stringify({
			title: removeMarkdownFormatting(collectionTitle),
			sections: baseSections.sort(sortItems),
			id: collectionId
		} satisfies Collection)
	);
	for (const framework in frameworkSectionsMap) {
		const uniqueBaseSections = baseSections.filter((baseSection) => {
			return !frameworkSectionsMap[framework].some(
				(frameworkSection) => frameworkSection.id === baseSection.id
			);
		});
		fs.writeFileSync(
			path.join(
				generatedCollectionsDirPath,
				[collectionId, framework, "json"].join(".")
			),
			JSON.stringify({
				title: removeMarkdownFormatting(collectionTitle),
				sections: [
					...frameworkSectionsMap[framework],
					...uniqueBaseSections
				].sort(sortItems),
				id: collectionId
			} satisfies Collection)
		);
	}
};
