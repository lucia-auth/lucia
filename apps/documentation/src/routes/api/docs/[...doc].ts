import docs from '$lib/docs.js';
import type { RequestHandler } from '@sveltejs/kit';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { parse } from 'node-html-parser';

export const get: RequestHandler = async ({ params }) => {
	const doc = docs.find((doc) => doc.pathname === '/' + params.doc);
	if (!doc) {
		return {
			status: 404
		};
	}
	marked.setOptions({
		highlight: (code, lang) => {
			return hljs.highlight(code, {
				language: lang
			}).value;
		}
	});
	const renderer = new marked.Renderer();
	// open all links in a new tab
	// ref: https://github.com/markedjs/marked/issues/655#issuecomment-383226346
	const linkRenderer = renderer.link;
	renderer.link = (href, title, text) => {
		const html = linkRenderer.call(renderer, href, title, text);
		if (!href || href.startsWith('/')) return html;
		return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
	};

	let html = marked.parse(doc.raw, { renderer });
	const document = parse(html);
	document.querySelectorAll('table').forEach((element) => {
		const tableWrapperDiv = parse('<div class="table"/>').childNodes[0]
		const tableTopWrapperDiv = parse('<div class="table-top"/>').childNodes[0]
		const tableBottomWrapperDiv = parse('<div class="table-bottom"/>').childNodes[0]
		tableTopWrapperDiv.appendChild(element.clone())
		tableWrapperDiv.appendChild(tableTopWrapperDiv)
		tableWrapperDiv.appendChild(tableBottomWrapperDiv)
		element.parentNode.exchangeChild(element, tableWrapperDiv)
		
	});
	document.querySelectorAll('li').forEach((element) => {
		element.innerHTML = element.innerHTML.replaceAll(
			'[Breaking]',
			'<span class="breaking">[Breaking]</span>'
		);
	});
	html = document.toString()
	return {
		body: JSON.stringify({
			title: doc.title,
			html
		})
	};
};
