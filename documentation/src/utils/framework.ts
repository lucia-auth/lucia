import type { AstroGlobal } from "astro";

const frameworks = [
	{
		id: "astro",
		title: "Astro"
	},
	{
		id: "nextjs",
		title: "Next.js"
	},
	{
		id: "nuxt",
		title: "Nuxt"
	},
	{
		id: "remix",
		title: "Remix"
	},
	{
		id: "sveltekit",
		title: "SvelteKit"
	},
	{
		id: "qwik",
		title: "Qwik"
	}
] as const;

export default frameworks;

export const frameworkIds = frameworks.map((fw) => fw.id);

export type FrameworkId = (typeof frameworkIds)[number];

export const isValidFrameworkId = (
	val: any
): val is (typeof frameworkIds)[number] | null => {
	if (val === null) return true;
	if (frameworkIds.includes(val)) return true;
	return false;
};
