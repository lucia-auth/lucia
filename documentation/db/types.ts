import type { MarkdownInstance } from "astro";
import type { Schema } from "./schema";

export type CollectionConfig = {
	readonly id: Readonly<string[]> | Readonly<["*"]>;
	readonly schema?: Record<any, Schema<any>>;
	readonly docSchema?: Record<any, Schema<any>>;
	readonly _?: CollectionConfig;
};

export type DBConfig = Readonly<CollectionConfig[]>;

export type TransformDocumentToDocumentResult<
	C extends CollectionConfig,
	Id extends string,
	BaseCollectionId extends string
> = {
	_type: "document";
	_id: Id;
	_path: string;
	_order: number;
	_Content: MarkdownInstance<any>["Content"];
	_baseCollectionId: BaseCollectionId;
	_getHeadings: MarkdownInstance<any>["getHeadings"];
} & (C["docSchema"] extends {}
	? {
			[K in keyof C["docSchema"]]: C["docSchema"][K]["typeValue"][0];
	  }
	: {});

export type TransformConfigToResult<
	C extends CollectionConfig,
	BaseCollectionId extends string
> = {
	_id: keyof C["id"] extends "*" ? string : C["id"][number];
	_type: "collection";
	_path: string;
	_order: number;
	_baseCollectionId: BaseCollectionId;
	_collections: C["_"] extends {}
		? TransformConfigToResult<C["_"], BaseCollectionId>[]
		: [];
	_documents: TransformDocumentToDocumentResult<C, string, BaseCollectionId>[];
} & (C["schema"] extends {}
	? {
			[K in keyof C["schema"]]: C["schema"][K]["typeValue"][0];
	  }
	: {});

type QueryCollection<
	C extends CollectionConfig,
	BaseCollectionId extends string
> = {
	"*": {
		__type: TransformConfigToResult<C, BaseCollectionId>;
	} & (C["_"] extends {} ? QueryCollection<C["_"], BaseCollectionId> : {});
};

export type Query<C extends DBConfig> = {
	[K in C[number] as K["id"][number]]: {
		__type: TransformConfigToResult<K, K["id"][number]>;
	} & (K["_"] extends {} ? QueryCollection<K["_"], K["id"][number]> : {});
} & {
	"*": {
		__type: TransformConfigToResult<C[number], C[number]["id"][number]>;
	} & (C[number]["_"] extends {}
		? QueryCollection<C[number]["_"], C[number]["id"][number]>
		: {});
};

export type CollectionQuery<
	Q extends {
		__type: any;
	}
> = Q["__type"];

export type DocumentQuery<
	Q extends {
		__type: any;
	}
> = Q["__type"]["_documents"][number];
