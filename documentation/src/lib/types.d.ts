type Content = {
	title: string;
	id: string;
	pages: {
		title: string;
		url: string;
	}[];
}[];

type Framework = "sveltekit" | "express" | "nextjs"