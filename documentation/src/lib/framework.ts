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
	}
] as const;

export default frameworks;

export const frameworkIds = frameworks.map((fw) => fw.id);

export type FrameworkId = (typeof frameworkIds)[number];

export const setFrameworkId = async (
	Astro: AstroGlobal,
	frameworkId: FrameworkId | null
) => {
	if (frameworkId) {
		Astro.cookies.set("framework", frameworkId, {
			path: "/"
		});
	} else {
		Astro.cookies.set("framework", "", {
			path: "/",
			maxAge: 0
		});
	}
};

export const getFrameworkId = (Astro: AstroGlobal): FrameworkId | null => {
	const getRequestFrameworkId = (): FrameworkId | null => {
		for (const frameworkId of frameworkIds) {
			if (Astro.url.searchParams.has(frameworkId)) return frameworkId;
		}
		if (Astro.url.searchParams.has("none")) return null;
		const cookieFrameworkId = Astro.cookies.get("framework").value ?? null;
		if (isValidFrameworkId(cookieFrameworkId)) return cookieFrameworkId;
		return null;
	};
	const frameworkId = getRequestFrameworkId();
	setFrameworkId(Astro, frameworkId);
	return frameworkId;
};

export const isValidFrameworkId = (
	val: any
): val is (typeof frameworkIds)[number] | null => {
	if (val === null) return true;
	if (frameworkIds.includes(val)) return true;
	return false;
};
