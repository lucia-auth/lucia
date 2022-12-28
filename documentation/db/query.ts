import type { MarkdownInstance } from "astro";
import type {
	CollectionConfig,
	DBConfig,
	TransformConfigToResult,
	TransformDocumentToDocumentResult
} from "./types";
import { validateObjectSchema } from "./schema";

type MetaData = Record<string, any>;

type MDFile = MarkdownInstance<{
	_order?: number;
	_date?: string;
	[k: string]: any;
}>;

const metaDataFileImports = Object.entries(
	import.meta.glob<MetaData>("../collection/**/_.json")
).map(([fileName, importer]) => {
	return [fileName.replace("../collection/", ""), importer] as const;
});
const markdownFileImports = Object.entries(import.meta.glob<MDFile>("../collection/**/*.md")).map(
	([fileName, importer]) => {
		return [fileName.replace("../collection/", ""), importer] as const;
	}
);

type Directory = {
	metaData: () => Promise<MetaData>;
	directory: Record<string, Directory>;
	document: Record<string, () => Promise<MDFile>>;
};

const fileSystemMap = markdownFileImports.reduce(
	(prev, curr) => {
		const pathSections = curr[0].split("/");
		let target: Directory = prev;
		pathSections.forEach((section, i) => {
			if (i === pathSections.length - 1) {
				target.document[section.replace(".md", "")] = curr[1];
			} else {
				if (target.directory[section] === undefined) {
					target.directory[section] = {
						directory: {},
						document: {},
						metaData:
							metaDataFileImports.find(([filePath]) => {
								return filePath === `${pathSections.slice(0, i + 1).join("/")}/_.json`;
							})?.[1] ??
							(async () => {
								return {};
							})
					};
				}
				target = target.directory[section];
			}
		});
		return prev;
	},
	{
		directory: {},
		document: {},
		metaData: async () => {
			return {};
		}
	} satisfies Directory
) as Directory;

export class DB<Config extends DBConfig> {
	private config: Config;
	public collection = <Id extends Config[number]["id"][number]>(collectionId: Id) => {
		type Target = {
			[K in Config[number] as K["id"][number]]: K;
		}[Id];
		const collection = this.config.find((val) => {
			return val.id.includes(collectionId);
		});
		if (!collection) throw new Error(`Collection not found: ${collectionId}`);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return new Collection<Target>(collection, [collectionId]);
	};
	constructor(config: Config) {
		this.config = config;
	}
}

const transformDocumentToNode = async (
	config: CollectionConfig,
	path: string[],
	resolve: () => Promise<MDFile>
): Promise<DocumentNode> => {
	const resolvedFile = await resolve();
	const metaDataSchema =
		path.slice(1, -1).reduce((prev) => {
			return prev?._ ?? null;
		}, config as CollectionConfig | null)?.docSchema ?? {};
	const id = path.at(-1);
	if (id === undefined) throw new Error();
	const metaData = validateObjectSchema(metaDataSchema, resolvedFile.frontmatter);
	return {
		_type: "document",
		_id: id,
		_order: resolvedFile.frontmatter._order ?? -1,
		_path: path.join("/"),
		_Content: resolvedFile.Content,
		_getHeadings: resolvedFile.getHeadings,
		...Object.fromEntries(Object.entries(metaData).filter(([key]) => !key.startsWith("_")))
	};
};

class Collection<Config extends CollectionConfig> {
	private config: Config;
	private pathIds: string[];
	public collection = <
		Id extends Config["_"] extends {}
			? Config["_"]["id"][number] extends "*"
				? string
				: Config["_"]["id"][number]
			: never
	>(
		collectionId: Id
	) => {
		if (!this.config._) throw new Error(`Collection not found: ${collectionId}`);
		return new Collection(
			this.config._ as Exclude<Config["_"], undefined>,
			[...this.pathIds, collectionId] as [...typeof this.pathIds, Id]
		);
	};
	public document = <Id extends string>(documentId: Id) => {
		return new Document(this.config, [...this.pathIds, documentId], documentId);
	};
	public get = async () => {
		const targetDirectory = this.pathIds.reduce((prev, curr) => {
			const dir = prev.directory[curr];
			if (!dir) throw new Error("404");
			return dir;
		}, fileSystemMap);
		const transformDirectoryToNode = async (
			path: string[],
			dir: Directory
		): Promise<CollectionNode> => {
			const metaDataSchema =
				path.slice(1).reduce((prev) => {
					return prev?._ ?? null;
				}, this.config as CollectionConfig | null)?.schema ?? {};
			const resolvedMetaData = await dir.metaData();
			const id = path.at(-1);
			if (id === undefined) throw new Error();
			const collections = await Promise.all(
				Object.entries(dir.directory).map(([key, value]) =>
					transformDirectoryToNode([...path, key], value)
				)
			);
			const documents = await Promise.all(
				Object.entries(dir.document).map(([key, value]) =>
					transformDocumentToNode(this.config, [...path, key], value)
				)
			);
			const sortFunction = (a: CollectionNode | DocumentNode, b: CollectionNode | DocumentNode) => {
				if (a._order > -1 && b._order > -1 && a._order !== b._order) return a._order - b._order;
				return a._id.localeCompare(b._id);
			};
			collections.sort(sortFunction);
			documents.sort(sortFunction);
			const metaData = validateObjectSchema(metaDataSchema, resolvedMetaData?.default ?? {});
			return {
				_type: "collection",
				_id: id,
				_path: path.join("/"),
				_order: metaData._order ?? -1,
				_collections: collections,
				_documents: documents,
				...Object.fromEntries(Object.entries(metaData).filter(([key]) => !key.startsWith("_")))
			};
		};
		return (await transformDirectoryToNode(
			this.pathIds,
			targetDirectory
		)) as TransformConfigToResult<Config>;
	};
	constructor(config: Config, pathIds: string[]) {
		this.config = config;
		this.pathIds = pathIds;
	}
}

class Document<Config extends CollectionConfig, PathIds extends string[], Id extends string> {
	private collectionConfig: Config;
	private pathIds: PathIds;
	private id: Id;
	constructor(collectionConfig: Config, pathIds: PathIds, id: Id) {
		this.collectionConfig = collectionConfig;
		this.pathIds = pathIds;
		this.id = id;
	}
	public get = async () => {
		const targetDirectory = this.pathIds.slice(0, -1).reduce((prev, curr) => {
			const dir = prev.directory[curr];
			if (!dir) throw new Error("404");
			return dir;
		}, fileSystemMap);
		const documentId = this.pathIds.at(-1);
		if (documentId === undefined) throw new Error();
		return (await transformDocumentToNode(
			this.collectionConfig,
			this.pathIds,
			targetDirectory.document[documentId]
		)) as TransformDocumentToDocumentResult<typeof this.collectionConfig, Id>;
	};
}

type CollectionNode = {
	_type: "collection";
	_id: string;
	_path: string;
	_order: number;
	_collections: CollectionNode[];
	_documents: DocumentNode[];
};

type DocumentNode = {
	_type: "document";
	_id: string;
	_path: string;
	_order: number;
	_Content: MarkdownInstance<any>["Content"];
	_getHeadings: MarkdownInstance<any>["getHeadings"];
};
