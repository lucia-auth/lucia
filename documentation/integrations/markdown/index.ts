import rehype from "./rehype";

import type { AstroIntegration } from "astro";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:markdown",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				updateConfig({
					markdown: {
						rehypePlugins: [rehype()]
					}
				});
			}
		}
	};
	return integration;
};

export const removeMarkdownFormatting = (text: string) => {
	return text.replaceAll("`", "");
};

export const generateMarkdownHtml = (text: string) => {
	return text.replace(/`(.*)`/g, "<code>$1</code>");
};
