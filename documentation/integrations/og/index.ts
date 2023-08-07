import fs from "fs/promises";
import path from "path";
import InitCanvasKit from "canvaskit-wasm";
import sharp from "sharp";

import type { AstroIntegration } from "astro";
import type { CanvasKit } from "canvaskit-wasm";

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
			page.url + ".jpg"
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

const SCALE = 2;
const PADDING = 100;
const WIDTH = 1200;
const HEIGHT = 630;
const MAIN_COLOR = "#5f57ff";

let CanvasKit: CanvasKit;
let semiboldInterFontFile: Buffer;
let mediumInterFontFile: Buffer;
let logoBuffer: Buffer;

const createImage = async (
	title: string,
	description: string | null
): Promise<Buffer> => {
	if (!CanvasKit) {
		CanvasKit = await InitCanvasKit();
	}
	if (!semiboldInterFontFile) {
		semiboldInterFontFile = await fs.readFile(
			path.join(process.cwd(), "integrations/og/inter-semibold.ttf")
		);
	}
	if (!mediumInterFontFile) {
		mediumInterFontFile = await fs.readFile(
			path.join(process.cwd(), "integrations/og/inter-medium.ttf")
		);
	}
	if (!logoBuffer) {
		logoBuffer = await fs.readFile(
			path.join(process.cwd(), "integrations/og/logo.png")
		);
	}

	const canvas = CanvasKit.MakeCanvas(WIDTH * SCALE, HEIGHT * SCALE);
	canvas.loadFont(semiboldInterFontFile, {
		family: "Inter",
		style: "normal",
		weight: "600"
	});
	canvas.loadFont(mediumInterFontFile, {
		family: "Inter",
		style: "normal",
		weight: "500"
	});

	const maxLineWidth = (WIDTH - PADDING * 2) * SCALE;
	const canvasContext = canvas.getContext("2d");
	if (!canvasContext) throw new Error();

	canvasContext.fillStyle = "white";
	canvasContext.fillRect(0, 0, WIDTH * SCALE, 630 * SCALE);

	let titleFontSize = 72;
	canvasContext.font = `600 ${titleFontSize * SCALE}px Inter`;
	canvasContext.fillStyle = "black";

	const titleTextWidth = canvasContext.measureText(title).width;
	let wrappedTitleLines: string[];
    let titleY = 250
	if (titleTextWidth < maxLineWidth * 2) {
		wrappedTitleLines = wrapCanvasText(canvasContext, title, maxLineWidth);
	} else {
		titleFontSize = 60;
		canvasContext.font = `600 ${titleFontSize * SCALE}px Inter`;
		canvasContext.fillStyle = "black";
		wrappedTitleLines = wrapCanvasText(canvasContext, title, maxLineWidth);
	}
    if (wrappedTitleLines.length > 2) {
        titleY = 200
    }
	for (const [lineNum, line] of wrappedTitleLines.entries()) {
		canvasContext.fillText(
			line,
			100 * SCALE,
			(titleY + (titleFontSize + 8) * lineNum) * SCALE
		);
	}

	if (description) {
		canvasContext.font = `500 ${36 * SCALE}px Inter`;
		canvasContext.fillStyle = "black";
		const wrappedDescription = wrapCanvasText(
			canvasContext,
			description,
			maxLineWidth
		);
		for (const [lineNum, line] of wrappedDescription.entries()) {
			canvasContext.fillText(
				line,
				100 * SCALE,
				(titleY +
					(36 + 8) * lineNum +
					titleFontSize * wrappedTitleLines.length +
					(wrappedTitleLines.length - 1) * 8) *
					SCALE
			);
		}
	}

	const img = canvas.decodeImage(logoBuffer);
	if (!img) throw new Error("Failed to decode logo image");
	canvasContext.drawImage(
		img as any, // broken types
		104 * SCALE,
		500 * SCALE,
		40 * SCALE,
		40 * SCALE
	);
	canvasContext.font = `600 ${40 * SCALE}px Inter`;
	canvasContext.fillStyle = MAIN_COLOR;
	canvasContext.fillText("Lucia", 144 * SCALE, 535 * SCALE);

	return sharp(Buffer.from(canvas.toDataURL("jpeg").split(",")[1], "base64"))
		.resize(WIDTH, HEIGHT)
		.toBuffer();
};

const wrapCanvasText = (
	canvasContext: CanvasRenderingContext2D,
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