import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";

// https://astro.build/config
import solidJs from "@astrojs/solid-js";

import type { Root, Element, ElementContent, RootContent, Text } from "hast";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), svelte(), solidJs()],
	markdown: {
		shikiConfig: {
			theme: "github-dark"
		},
		rehypePlugins: [
			[
				"rehype-wrap-all",
				{
					selector: "table",
					wrapper: "div.table-wrapper"
				}
			],
			[
				"rehype-rewrite",
				{
					selector: "blockquote",
					rewrite: (node: Root | RootContent) => {
						if (node.type !== "element") return;
						const pElement = node.children.find((child) => {
							if (child.type !== "element") return false;
							if (child.tagName !== "p") return false;
							return true;
						});
						if (pElement.type !== "element") return;
						const firstTextContent = pElement.children.filter(
							(child): child is Text => child.type === "text"
						)[0];
						if (!node.properties) return;
						const classNames = [
							...(node.properties.class?.toString() ?? "").split(" "),
							"bq-default"
						];
						if (firstTextContent.value.startsWith("(warn)")) {
							classNames.push("bq-warn");
							firstTextContent.value = firstTextContent.value.replace("(warn)", "")
						}
						if (firstTextContent.value.startsWith("(red)")) {
							classNames.push("bq-red");
							firstTextContent.value = firstTextContent.value.replace("(red)", "")
						}
						node.properties.class = classNames.join(" ");
					}
				}
			]
		],
		extendDefaultPlugins: true
	}
});
