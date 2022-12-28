import type { MarkdownInstance } from "astro";
import type { Schema } from "./schema";

export type CollectionConfig = {
	readonly id: Exclude<Readonly<string[]>, Readonly<["*"]>> | "*";
	readonly schema?: Record<any, Schema<any>>;
	readonly docSchema?: Record<any, Schema<any>>;
	readonly _?: CollectionConfig;
};

export type DBConfig = Readonly<CollectionConfig[]>;

export type TransformDocumentToDocumentResult<
	C extends CollectionConfig,
	Id extends string = string
> = {
	_type: "document";
	_id: Id;
	_path: string;
	_order: number;
	_Content: MarkdownInstance<any>["Content"];
	_getHeadings: MarkdownInstance<any>["getHeadings"];
} & (C["docSchema"] extends {}
	? {
			[K in keyof C["docSchema"]]: C["docSchema"][K]["typeValue"][0];
	  }
	: {});

export type TransformConfigToResult<C extends CollectionConfig> = {
	[x: string]: any;
	_id: C["id"] extends "*" ? string : C["id"][number];
	_type: "collection";
	_path: string;
	_order: number;
	_collections: C["_"] extends {} ? TransformConfigToResult<C["_"]>[] : [];
	_documents: TransformDocumentToDocumentResult<C>[];
} & (C["schema"] extends {}
	? {
			[K in keyof C["schema"]]: C["schema"][K]["typeValue"][0];
	  }
	: {});

type QueryCollection<C extends CollectionConfig> = {
	"*": {
		__type: TransformConfigToResult<C>;
	} & (C["_"] extends {} ? QueryCollection<C["_"]> : {});
};

export type Query<C extends DBConfig> = {
	[K in C[number] as K["id"][number]]: {
		__type: TransformConfigToResult<K>;
	} & (K["_"] extends {} ? QueryCollection<K["_"]> : {});
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
