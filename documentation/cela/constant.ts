import type { MarkdownInstance } from "astro";
import type { Collection, DocumentMetaData, Section } from "./types";

export const CELA_GENERATED_DIR = ".cela-generated";

export const contentImports = import.meta.glob(
	`/.cela-generated/content/*.md`
) as Record<
	string,
	undefined | (() => Promise<MarkdownInstance<DocumentMetaData>>)
>;

export const collectionImports = import.meta.glob(
	`/.cela-generated/collections/*.json`
) as Record<
	string,
	| undefined
	| (() => Promise<{
			default: Collection;
	  }>)
>;
