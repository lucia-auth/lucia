import type { GetStaticPaths } from "astro";

export type GetPropsFromGetStaticPaths<T extends GetStaticPaths> = Awaited<
	ReturnType<T>
> extends any[]
	? Awaited<ReturnType<T>>[number]["props"]
	: Awaited<ReturnType<T>>["props"];

export type StaticPath = {
	params: Record<string, string>;
	props: Record<string, any>;
};
