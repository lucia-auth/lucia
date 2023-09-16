import fs from "fs/promises";
import path from "path";
import os from "os";
import {
	createCanvas,
	GlobalFonts,
	loadImage,
	clearAllCache
} from "@napi-rs/canvas";

import type { AstroIntegration } from "astro";
import type { SKRSContext2D } from "@napi-rs/canvas";

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

clearAllCache();

const distDirPathname = path.join(process.cwd(), "dist");

export const generateOgImages = async () => {
	const distDirState = await fs.stat(distDirPathname);
	if (!distDirState.isDirectory()) {
		throw new Error("Expect 'dist' to be a directory");
	}
	const htmlPathnames = await readHtmlDirectory(distDirPathname);
	const pages: Page[] = [];
	for (const htmlPathname of htmlPathnames) {
		console.log(htmlPathname);
		const file = await fs.readFile(htmlPathname);
		const htmlContent = file.toString("utf-8");
		const titleMatches = htmlContent.match(
			/og:title"\s*?content="([\s\S]*?)"\s*>/
		);
		const title = titleMatches?.at(1)?.replace("  Lucia", "");
		if (!title) continue;
		const descriptionMatches = htmlContent.match(
			/og:description"\s*?content="([\s\S]*?)"\s*>/
		);
		const description = descriptionMatches?.at(1) || null;
		const url = htmlPathname
			.replace(distDirPathname, "")
			.replace("/index.html", "");
		console.log(url);
		pages.push({
			title,
			pathname: htmlPathname,
			description,
			url
		});
	}
	const concurrency = os.cpus().length;
	console.log(
		`Generating ${pages.length} images with ${concurrency} concurrency`
	);
	const groups = groupByN(pages, concurrency);
	for (const group of groups) {
		await Promise.all(
			group.map(async (page) => {
				const imagePathname = path.join(
					process.cwd(),
					"dist",
					"og",
					page.url + ".jpg"
				);
				const image = await createImage(page.title, page.description);
				await fs.mkdir(path.dirname(imagePathname), {
					recursive: true
				});
				console.log(`Generated image: ${page.url}`);
				await fs.writeFile(imagePathname, image);
			})
		);
	}
};

function groupByN<T>(arr: T[], n: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += n) {
		result.push(arr.slice(i, i + n));
	}
	return result;
}

const readHtmlDirectory = async (pathname: string): Promise<string[]> => {
	const ignoreHtmlPathnames = ["404.html", "index.html"].map((filename) =>
		path.join(distDirPathname, filename)
	);
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

GlobalFonts.registerFromPath("integrations/og/inter-semibold.ttf", "Inter");
GlobalFonts.registerFromPath("integrations/og/inter-medium.ttf", "Inter");

const logo = await fs.readFile(
	path.join(process.cwd(), "integrations/og/logo.png")
);

const logoImage = await loadImage(logo);

const createImage = async (
	title: string,
	description: string | null
): Promise<Buffer> => {
	const canvas = createCanvas(1200, 630);

	const canvasContext = canvas.getContext("2d");

	canvasContext.fillStyle = "white";
	canvasContext.fillRect(0, 0, 1200, 630);

	let titleFontSize = 72;
	canvasContext.font = `600 ${titleFontSize}px Inter`;
	canvasContext.fillStyle = "black";

	const titleTextWidth = canvasContext.measureText(title).width;
	const maxLineWidth = 1000;
	let wrappedTitleLines: string[];
	let titleY = 250;
	if (titleTextWidth < maxLineWidth * 2) {
		wrappedTitleLines = wrapCanvasText(canvasContext, title, maxLineWidth);
	} else {
		titleFontSize = 60;
		canvasContext.font = `600 ${titleFontSize}px Inter`;
		wrappedTitleLines = wrapCanvasText(canvasContext, title, maxLineWidth);
	}
	if (wrappedTitleLines.length > 2) {
		titleY = 200;
	}
	for (const [lineNum, line] of wrappedTitleLines.entries()) {
		canvasContext.fillText(line, 100, titleY + (titleFontSize + 8) * lineNum);
	}

	if (description) {
		canvasContext.font = `500 ${36}px Inter`;
		const wrappedDescription = wrapCanvasText(
			canvasContext,
			description,
			maxLineWidth
		);
		for (const [lineNum, line] of wrappedDescription.entries()) {
			canvasContext.fillText(
				line,
				100,
				titleY +
					(36 + 8) * lineNum +
					titleFontSize * wrappedTitleLines.length +
					(wrappedTitleLines.length - 1) * 8
			);
		}
	}

	canvasContext.drawImage(logoImage, 103, 500);
	canvasContext.font = `500 ${40}px Inter`;
	canvasContext.fillStyle = "#5f57ff";
	canvasContext.fillText("Lucia", 138, 532);

	return await canvas.encode("jpeg");
};

const wrapCanvasText = (
	canvasContext: SKRSContext2D,
	title: string,
	maxLineWidth: number
): string[] => {
	let currentLineTextWidth = 0;
	let currentLineText = "";
	const lines: string[] = [];
	const spaceTextWidth = canvasContext.measureText(" ").width;
	for (const word of title.split(" ")) {
		const wordTextWidth = canvasContext.measureText(word).width;
		if (wordTextWidth + currentLineTextWidth < maxLineWidth) {
			currentLineText = currentLineText + word + " ";
			currentLineTextWidth =
				currentLineTextWidth + wordTextWidth + spaceTextWidth;
		} else {
			lines.push(currentLineText);
			currentLineText = word + " ";
			currentLineTextWidth = wordTextWidth + spaceTextWidth;
		}
	}
	if (currentLineText) {
		lines.push(currentLineText);
	}
	return lines;
};
