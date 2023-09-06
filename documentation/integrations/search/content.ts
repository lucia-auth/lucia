import { getPages } from "@utils/content";
import type { APIRoute } from "astro";

const blacklist: string[] = ["main/migrate/v2"]

export const GET: APIRoute = async () => {
	const pages = await getPages();
	return new Response(
		pages
			.filter((page) => {
				console.log(page.pathname)
				return page.frameworkId === null && page.collectionId !== "blog" && !blacklist.includes(page.pathname);
			})
			.map((page) => {
				let encodedHeadings = "";
				if (page.versions.length === 0 && page.collectionId !== "guidebook") {
					encodedHeadings = page.headings
						.filter((heading) => heading.depth < 5)
						.map((headings) => headings.text)
						.join("\\");
				}
				return [page.title, page.href, page.description ?? "", encodedHeadings];
			})
			.flat()
			.join("|"),
		{
			headers: {
				"Content-Type": "text/plain"
			}
		}
	);
};
