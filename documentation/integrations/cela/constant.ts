import type { MarkdownInstance } from "astro";
import type { Collection, ContentLink } from "./types";

export const CELA_GENERATED_DIR = ".cela_generated";

export const generatedLinksImports = import.meta.glob(
	`/.cela_generated/content/*.json`
) as Record<string, undefined | (() => Promise<ContentLink>)>;

export const contentImports = import.meta.glob("/content/**/*.md") as Record<
	string,
	undefined | (() => Promise<MarkdownInstance<{}>>)
>;

export const collectionImports = import.meta.glob(
	`/.cela_generated/collections/*.json`
) as Record<
	string,
	| undefined
	| (() => Promise<{
			default: Collection;
	  }>)
>;
