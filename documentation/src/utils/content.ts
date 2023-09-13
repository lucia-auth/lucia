import type { MarkdownHeading, MarkdownInstance } from "astro";

type FrameworkId = keyof typeof frameworkNameDictionary;

type MarkdownFile = MarkdownInstance<{
	title: string;
	description?: string;
	hidden?: boolean;
}>;

const markdownImports = Object.entries(
	import.meta.glob<MarkdownFile>("../../content/**/*.md")
).map(([importPath, resolve]) => {
	return [
		importPath
			.replace("../../content/", "")
			.replace(".md", "")
			.replace("/index", ""),
		resolve as () => Promise<MarkdownFile>
	] as const;
});

type FrameworkVersion = {
	href: string;
	name: string;
};

export type Page = {
	pathname: string;
	href: string;
	collectionId: string;
	title: string;
	htmlTitle: string;
	hidden: boolean;
	htmlDescription: string | null;
	description: string | null;
	versions: FrameworkVersion[];
	frameworkId: FrameworkId | null;
	Content: MarkdownInstance<any>["Content"];
	headings: MarkdownHeading[];
};

const parseMarkdownCode = (text: string) => {
	let result = text;
	while (result.includes("`")) {
		result = result.replace("`", "<code>").replace("`", "</code>");
	}
	return result;
};

const removeMarkdownCode = (text: string) => {
	return text.replaceAll("`", "");
};

export const getPages = async (collectionId?: string): Promise<Page[]> => {
	const targetImports = markdownImports.filter(([pathname]) => {
		if (collectionId === undefined) return true;
		return pathname.startsWith(collectionId + "/") || pathname === collectionId;
	});
	const pages = await Promise.all(
		targetImports.map(async ([pathname, resolve]): Promise<Page> => {
			const resolvedFile = await resolve();
			const rawDescription = resolvedFile.frontmatter.description ?? null;
			return {
				pathname,
				href: getHrefFromContentPathname(pathname),
				collectionId: pathname.split("/")[0],
				title: removeMarkdownCode(resolvedFile.frontmatter.title),
				htmlTitle: parseMarkdownCode(resolvedFile.frontmatter.title),
				description: rawDescription ? removeMarkdownCode(rawDescription) : null,
				htmlDescription: rawDescription
					? parseMarkdownCode(rawDescription)
					: null,
				hidden: Boolean(resolvedFile.frontmatter.hidden),
				versions: [],
				frameworkId: getFrameworkIdFromContentPathname(pathname),
				Content: resolvedFile.Content,
				headings: resolvedFile.getHeadings()
			};
		})
	);
	for (const page of pages) {
		page.versions = pages
			.filter((maybeNestedPage) => {
				return maybeNestedPage.pathname.startsWith(page.pathname + "/$");
			})
			.map((page): FrameworkVersion => {
				if (!page.frameworkId) throw new Error("Version not defined");
				return {
					name: frameworkNameDictionary[page.frameworkId],
					href: page.href
				};
			});
	}
	return pages;
};

const getHrefFromContentPathname = (pathname: string): string => {
	if (pathname.startsWith("main/")) {
		return pathname.replace("main/", "/").replace("$", "");
	}
	return "/" + pathname.replace("$", "");
};

const getFrameworkIdFromContentPathname = (
	pathname: string
): FrameworkId | null => {
	const lastPathnameSegment = pathname.split("/").at(-1) ?? null;
	if (!lastPathnameSegment) return null;
	if (!lastPathnameSegment.startsWith("$")) return null;
	const version = lastPathnameSegment.replace("$", "");
	if (!isValidFrameworkVersion(version)) return null;
	return version;
};

const isValidFrameworkVersion = (
	maybeFrameworkVersion: string
): maybeFrameworkVersion is keyof typeof frameworkNameDictionary => {
	return maybeFrameworkVersion in frameworkNameDictionary;
};

const frameworkNameDictionary = {
	astro: "Astro",
	electron: "Electron",
	elysia: "Elysia",
	express: "Express",
	fastify: "Fastify",
	hono: "Hono",
	"nextjs-app": "Next.js App Router",
	"nextjs-pages": "Next.js Pages Router",
	nuxt: "Nuxt",
	qwik: "Qwik",
	"react-native": "React Native",
	remix: "Remix",
	solidstart: "SolidStart",
	sveltekit: "SvelteKit",
	tauri: "Tauri"
} as const;
