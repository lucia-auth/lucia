import fs from "fs/promises";
import path from "path";
import satori from "satori";
import { html } from "satori-html";

import type { AstroIntegration } from "astro";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:og",
		hooks: {
			"astro:build:done": generateOgImages
		}
	};
	return integration;
};

type Page = {
	title: string;
	pathname: string;
	description: string | null;
	url: string;
};

const distDirPathname = path.join(process.cwd(), "dist");

export const generateOgImages = async () => {
	const distDirState = await fs.stat(distDirPathname);
	if (!distDirState.isDirectory()) {
		throw new Error("Expect 'dist' to be a directory");
	}
	const htmlPathnames = await readHtmlDirectory(distDirPathname);
	const pages: Page[] = [];
	for (const htmlPathname of htmlPathnames) {
		const file = await fs.readFile(htmlPathname);
		const htmlContent = file.toString("utf-8");
		const titleMatches = htmlContent.match(
			/og:title"\s*?content="([\s\S]*?)"\s*>/
		);
		const title = titleMatches?.at(1)?.replace(" | Lucia", "");
		if (!title) throw new Error("Page does not have a title");
		const descriptionMatches = htmlContent.match(
			/og:description"\s*?content="([\s\S]*?)"\s*>/
		);
		const description = descriptionMatches?.at(1) || null;
		const url = htmlPathname
			.replace(distDirPathname, "")
			.replace("/index.html", "");
		pages.push({
			title,
			pathname: htmlPathname,
			description,
			url
		});
	}
	for (const page of pages) {
		const imagePathname = path.join(
			process.cwd(),
			"dist",
			"og",
			page.url + ".svg"
		);
		const image = await createImage(page.title, page.description);
		await fs.mkdir(path.dirname(imagePathname), {
			recursive: true
		});
		console.log(`Generated image: ${page.url}`);
		await fs.writeFile(imagePathname, image);
	}
};

const ignoreHtmlPathnames = ["404.html", "index.html"].map((filename) =>
	path.join(distDirPathname, filename)
);

const readHtmlDirectory = async (pathname: string): Promise<string[]> => {
	const contentNames = await fs.readdir(pathname);
	const filePaths: string[] = [];
	const readChildDirectoryPromises: Promise<string[]>[] = [];
	for (const contentName of contentNames) {
		if (contentName.endsWith(".html")) {
			const htmlPathname = path.join(pathname, contentName);
			if (ignoreHtmlPathnames.includes(htmlPathname)) continue;
			filePaths.push(htmlPathname);
		}
		if (contentName.includes(".")) {
			continue;
		}
		readChildDirectoryPromises.push(
			readHtmlDirectory(path.join(pathname, contentName))
		);
	}
	const childDirectoryFiles = await Promise.all(readChildDirectoryPromises);
	for (const childDirectoryFilenames of childDirectoryFiles) {
		filePaths.push(...childDirectoryFilenames);
	}
	return filePaths;
};

const logoBuffer = await fs.readFile(
	path.join(process.cwd(), "integrations/og/logo.svg")
);
const semiboldInterFontFile = await fs.readFile(
	path.join(process.cwd(), "integrations/og/inter-semibold.ttf")
);
const mediumInterFontFile = await fs.readFile(
	path.join(process.cwd(), "integrations/og/inter-medium.ttf")
);

const ogHtml = `<div
	style="display: flex; flex-direction: column; position: relative; padding-right: 100px; padding-left:100px; background-color: white; height: 100%; width: 100%;"
>
	<div style="font-size: $4px;margin-top: $5px; display: flex; font-family: Inter; font-weight: 600;">$1</div>
	<div style="font-size: 32px; display: flex; font-family: Inter; font-weight: 500; margin-top: 16px;">$2</div>
	<div style="position: absolute; bottom:100px; display: flex; margin-left: 100px;">
		<img src="$3" height="40" width="40" style="display: flex;"/>
		<div style="display: flex; font-size:36px; color:#5f57ff; font-family: Inter; font-weight: 600;">Lucia</div>
	</div>
</div>`;

const createImage = async (
	title: string,
	description: string | null
): Promise<string> => {
	const markup = html(
		ogHtml
			.replace("$1", title)
			.replace("$2", description ?? "")
			.replace(
				"$3",
				`data:image/svg+xml;base64,${logoBuffer.toString("base64")}`
			)
			.replace("$4", title.length > 48 ? "60" : "72")
			.replace("$5", title.length > 48 ? "100" : "150")
	);
	const svg = await satori(markup as any, {
		width: 1200,
		height: 630,
		fonts: [
			{
				name: "Inter",
				data: semiboldInterFontFile,
				weight: 600
			},
			{
				name: "Inter",
				data: mediumInterFontFile,
				weight: 500
			}
		]
	});
	return svg;
};
