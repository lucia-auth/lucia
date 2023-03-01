import type { MarkdownInstance } from "astro";
import {
	validateObjectSchema,
	type ParsedSchema,
	type SchemaObject
} from "./schema";

validateObjectSchema({}, {});
export type BaseCollectionConfig = {
	readonly id: string;
	readonly schema?: SchemaObject;
	readonly docSchema?: SchemaObject;
};

export type DBConfig = BaseCollectionConfig[];

type MaybeObject<T extends {} | undefined> = T extends {} ? T : {};

// create object where key is the base collection id, value is the collection config
// and select the config using the base collection id from the query
// validate result type extends BaseCollectionConfig
type ExtractCollectionConfigById<
	Id extends string,
	Config extends DBConfig
> = ValidateType<
	{
		[K in Config[number] as K["id"]]: K;
	}[Id],
	BaseCollectionConfig
>;

type ValidateType<Target, Reference> = Target extends Reference
	? Target
	: never;

type MDFile<Schema extends Record<string, any> = Record<string, any>> =
	MarkdownInstance<
		{
			_order?: number;
			_date?: string;
		} & Schema
	>;

type Collection<Config extends BaseCollectionConfig = any> = {
	_order: number;
	metaData: ParsedSchema<MaybeObject<Config["schema"]>>;
	children: Collection<Config>[];
	documents: Document<Config>[];
	id: string;
	path: string;
	$getAllNestedDocuments: () => Document<Config>[];
};

type Document<Config extends BaseCollectionConfig = any> = {
	_order: number;
	id: string;
	metaData: ParsedSchema<MaybeObject<Config["docSchema"]>>;
	path: string;
	$Content: MDFile["Content"];
	$getHeadings: MDFile["getHeadings"];
};

type CollectionMap<Config extends DBConfig = any> = {
	[CollectionConfig in Config[number] as CollectionConfig["id"]]: Collection<CollectionConfig>;
};

const removeHiddenProperties = <T extends {}>(obj: T) => {
	return Object.fromEntries(
		Object.entries(obj).filter(([key]) => !key.startsWith("_"))
	) as Omit<T, `_${string}`>;
};

export class DB<Config extends DBConfig> {
	public fileMapPromise: Promise<CollectionMap>;
	constructor(config: Config) {
		const createFileMap = async () => {
			const metaDataFiles = await Promise.all(
				Object.entries(
					import.meta.glob<{
						default: Record<string, any>;
					}>("../collection/**/_.json")
				).map(async ([filePath, resolve]) => {
					return [
						filePath.replace("../collection/", ""),
						await resolve()
					] as const;
				})
			);
			const markdownFiles = await Promise.all(
				Object.entries(import.meta.glob<MDFile>("../collection/**/*.md")).map(
					async ([filePath, resolve]) => {
						return [
							filePath.replace("../collection/", ""),
							await resolve()
						] as const;
					}
				)
			);
			const fileMap: CollectionMap = {};
			const getDirectory = (dirPath: string): Collection => {
				const baseCollectionId = dirPath.split("/").at(0);
				if (!baseCollectionId) throw new Error();
				const collectionConfig = config.find(
					(val) => val.id === baseCollectionId
				);
				if (!collectionConfig) throw new Error();
				const isChildrenFile = (filePath: string) => {
					const isNestedFile = filePath.startsWith(dirPath);
					const isDirectNestedFile =
						isNestedFile &&
						filePath.split("/").length === dirPath.split("/").length + 1;
					return isDirectNestedFile;
				};
				const metaDataFile = metaDataFiles.find(([filePath]) =>
					isChildrenFile(filePath)
				)?.[1] ?? {
					default: {}
				};
				const order =
					typeof metaDataFile.default._order === "number"
						? metaDataFile.default._order
						: -1;
				const metaData = validateObjectSchema(
					collectionConfig.schema ?? {},
					removeHiddenProperties(metaDataFile.default)
				);
				const childrenPaths = new Set<string>();
				for (const [filePath] of [...metaDataFiles, ...markdownFiles]) {
					if (!filePath.startsWith(dirPath)) continue;
					const isNestedDirectoryChildren =
						filePath.split("/").length > dirPath.split("/").length + 1;
					if (!isNestedDirectoryChildren) continue;
					const childrenPath = filePath
						.split("/")
						.slice(0, dirPath.split("/").length + 1)
						.join("/");
					childrenPaths.add(childrenPath);
				}
				const children = [...childrenPaths]
					.map((childPath) => {
						const childName = childPath.split("/").at(-1);
						if (!childName) throw new Error();
						return getDirectory(childPath);
					})
					.sort(({ _order: aOrder }, { _order: bOrder }) => aOrder - bOrder);
				const documents = markdownFiles
					.filter(([filePath]) => isChildrenFile(filePath))
					.map(([filePath, file]) => {
						const fileName = filePath.split("/").at(-1);
						if (!fileName) throw new Error();
						const fileId = fileName.split(".").slice(0, -1).join(".");
						const order = file.frontmatter._order ?? -1;
						return {
							_order: order,
							id: fileId,
							metaData: validateObjectSchema(
								collectionConfig.docSchema ?? {},
								removeHiddenProperties(file.frontmatter)
							),
							path: [dirPath, fileId].join("/"),
							$Content: file.Content,
							$getHeadings: file.getHeadings
						} as const satisfies Document;
					})
					.sort(({ _order: aOrder }, { _order: bOrder }) => aOrder - bOrder);
				const directoryId = dirPath.split("/").at(-1);
				if (!directoryId) throw new Error();
				const getAllNestedDocuments = (currentCollection: {
					documents: Document<BaseCollectionConfig>[];
					children: Collection<BaseCollectionConfig>[];
				}): Document<Collection>[] => {
					return [
						...currentCollection.documents,
						...currentCollection.children
							.map((child) => getAllNestedDocuments(child))
							.flat()
					];
				};
				return {
					path: dirPath,
					id: directoryId,
					_order: order,
					metaData,
					children,
					documents,
					$getAllNestedDocuments: () =>
						getAllNestedDocuments({
							documents,
							children
						})
				} as const;
			};
			for (const collectionConfig of config) {
				fileMap[collectionConfig.id] = getDirectory(collectionConfig.id);
			}
			return fileMap as CollectionMap<Config>;
		};
		this.fileMapPromise = createFileMap();
	}
	public query = async <
		PathSegments extends [Config[number]["id"], ...string[]]
	>(
		...pathSegments: PathSegments
	) => {
		const collectionMap = await this.fileMapPromise;
		const baseCollectionId = pathSegments[0];
		if (!(baseCollectionId in collectionMap))
			throw new Error(`Collection "${baseCollectionId}" does not exist`);
		const localPathSegments = pathSegments.slice(1);
		let currentCollection = collectionMap[baseCollectionId];
		for (const localPathSegment of localPathSegments) {
			const collectionSearchResult =
				currentCollection.children.find(
					(child) => child.id === localPathSegment
				) ?? null;
			if (!collectionSearchResult)
				throw new Error(`Collection ${pathSegments.join("/")} does not exist`);
			currentCollection = collectionSearchResult;
		}
		type CollectionConfig = ExtractCollectionConfigById<
			PathSegments[0],
			Config
		>;
		return currentCollection as Collection<CollectionConfig>;
	};
}

export type CollectionQuery<
	DBInstance extends DB<any>,
	CollectionId extends DBInstance extends DB<infer Config>
		? Config[number]["id"]
		: never
> = Collection<
	ExtractCollectionConfigById<
		CollectionId,
		DBInstance extends DB<infer Config> ? Config : never
	>
>;

export type QueryDocument<
	DBInstance extends DB<any>,
	CollectionId extends DBInstance extends DB<infer Config>
		? Config[number]["id"]
		: never
> = CollectionQuery<DBInstance, CollectionId>["documents"][number];
