import type { AstroGlobal } from "astro";

const frameworks = [
	{
		id: "sveltekit",
		title: "SvelteKit"
	},
	{
		id: "nextjs",
		title: "Next.js"
	},
	{
		id: "astro",
		title: "Astro"
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
