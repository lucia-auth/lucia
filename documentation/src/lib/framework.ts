import type { AstroGlobal } from "astro";

const frameworks = [
	{
		id: "none",
		title: "None"
	},
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
];

export default frameworks;

export const frameworkIds = frameworks.map((fw) => fw.id);

export const getFrameworkId = (Astro: AstroGlobal) => {
	let frameworkId = Astro.url.searchParams.get("framework") ?? null;

	frameworkId ||= Astro.cookies.get("framework").value ?? "none";

	if (frameworkId && !frameworkIds.includes(frameworkId)) {
		frameworkId = "none";
	}

	Astro.cookies.set("framework", frameworkId, {
		path: "/"
	});
	return frameworkId;
};
