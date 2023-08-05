import fs from "fs/promises";
import path from "path";
import InitCanvasKit from "canvaskit-wasm";

import type { AstroIntegration } from "astro";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:markdown",
		hooks: {
			"astro:build:done": async () => {
				await generateOgImages();
			}
		}
	};
	return integration;
};

export const generateOgImages = async () => {
	const distDirPathname = path.join(process.cwd(), "dist");
	const distDirState = await fs.stat(distDirPathname);
	if (!distDirState.isDirectory()) {
		throw new Error("Expect 'dist' to be a directory");
	}
	const htmlFilePathnames = await readHtmlDirectory(distDirPathname);
	const pages = await Promise.all(
		htmlFilePathnames.map(async (pathname) => {
			const file = await fs.readFile(pathname);
			const htmlContent = file.toString("utf-8");
			const titleMatches = htmlContent.match(/<title>([\S\s]*?)<\/title>/);
			const title = titleMatches?.at(1)?.replace(" | Lucia", "");
			if (!title) throw new Error("Page does not have a title");
			const descriptionMatches = htmlContent.match(
				/og:description"\s*?content="([\s\S]*?)"\s*>/
			);
			const description = descriptionMatches?.at(1) ?? "";
			const url = pathname.replace(distDirPathname, "");
			return {
				title,
				pathname,
				description,
				url
			};
		})
	);
	const image = await createImage(pages[10].title, pages[10].description);
	await fs.writeFile(
		path.join(distDirPathname, "og", pages[10].url.replace(".html", ".jpeg")),
		image
	);
};

const readHtmlDirectory = async (pathname: string): Promise<string[]> => {
	const contentNames = await fs.readdir(pathname);
	const filePaths: string[] = [];
	const readChildDirectoryPromises: Promise<string[]>[] = [];
	for (const contentName of contentNames) {
		if (contentName.endsWith(".html")) {
			filePaths.push(path.join(pathname, contentName));
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

const createImage = async (
	title: string,
	description: string
): Promise<Buffer> => {
	const CanvasKit = await InitCanvasKit();
	// registerFont(path.join(process.cwd(), "integrations/og/inter-semibold.ttf"), {
	// 	family: "Inter"
	// });
	// registerFont(path.join(process.cwd(), "integrations/og/inter-medium.ttf"), {
	// 	family: "Inter"
	// });
	const semiboldInterFontFile = await fs.readFile(
		path.join(process.cwd(), "integrations/og/inter-semibold.ttf")
	);
	const mediumInterFontFile = await fs.readFile(
		path.join(process.cwd(), "integrations/og/inter-medium.ttf")
	);

	const canvas = CanvasKit.MakeCanvas(1200, 630);
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

	const maxLineWidth = 1000;
	const canvasContext = canvas.getContext("2d");
	if (!canvasContext) throw new Error();

	canvasContext.fillStyle = "white";
	canvasContext.fillRect(0, 0, 1200, 630);

	canvasContext.font = "600 72px Inter";
	canvasContext.fillStyle = "black";
	const wrappedTitle = wrapCanvasText(canvasContext, title, maxLineWidth);
	canvasContext.fillText(wrappedTitle, 100, 250);

	canvasContext.font = "500 36px Inter";
	canvasContext.fillStyle = "black";
	const wrappedDescription = wrapCanvasText(
		canvasContext,
		description,
		maxLineWidth
	);
	canvasContext.fillText(wrappedDescription, 100, 250 + 72);

	// const logoFile = await fs.readFile(path.join("public", "logo.svg"))
	// const img = new Image()
	// img.src = "data:image/svg+xml;base64,"
	// canvasContext.drawImage(logoSvg.encodeToBytes(), 104, 500);

	canvasContext.font = "600 40px Inter";
	canvasContext.fillStyle = "#5f57ff";
	canvasContext.fillText("Lucia", 144, 535);

	return Buffer.from(canvas.toDataURL("jpeg").split(",")[1], "base64");
};

const wrapCanvasText = (
	canvasContext: CanvasRenderingContext2D,
	title: string,
	maxLineWidth: number
) => {
	let currentLineTextWidth = 0;
	let wrappedTitle = "";
	const spaceTextWidth = canvasContext.measureText(" ").width;
	for (const word of title.split(" ")) {
		const textWidth = canvasContext.measureText(word).width;
		if (textWidth + currentLineTextWidth < maxLineWidth) {
			wrappedTitle = wrappedTitle + word + " ";
			currentLineTextWidth = textWidth + currentLineTextWidth + spaceTextWidth;
		} else {
			wrappedTitle = wrappedTitle + "\n" + word + " ";
			currentLineTextWidth = textWidth + spaceTextWidth;
		}
	}
	return wrappedTitle;
};
