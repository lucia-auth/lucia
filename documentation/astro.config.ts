import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import solidJs from "@astrojs/solid-js";

import type { Root, RootContent, Text } from "hast";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind() as any, solidJs()],
	markdown: {
		shikiConfig: {
			theme: "github-dark"
		},
		rehypePlugins: [
			["siena", {}],
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
					rewrite: (node: Root | RootContent) => {
						const setBlockquoteProperties = () => {
							if (node.type !== "element" || node.tagName !== "blockquote")
								return;
							const pElement = node.children.find((child) => {
								if (child.type !== "element") return false;
								if (child.tagName !== "p") return false;
								return true;
							});
							if (pElement?.type !== "element") return;
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
								firstTextContent.value = firstTextContent.value.replace(
									"(warn)",
									""
								);
							}
							if (firstTextContent.value.startsWith("(red)")) {
								classNames.push("bq-red");
								firstTextContent.value = firstTextContent.value.replace(
									"(red)",
									""
								);
							}
							node.properties.class = classNames.join(" ");
						};
						setBlockquoteProperties();
					}
				}
			]
		]
	}
});
