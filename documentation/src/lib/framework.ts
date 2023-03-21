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
