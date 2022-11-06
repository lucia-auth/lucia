type Content = {
	title: string;
	id: string;
	pages: {
		title: string;
		url: string;
	}[];
}[];

type ExternalIntegration = "sveltekit" | "astro" | "nextjs" | "oauth"