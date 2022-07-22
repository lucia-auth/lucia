import docs from '$lib/docs.js';
import type { RequestHandler } from '@sveltejs/kit';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';

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

	const dom = new JSDOM(html);
	dom.window.document.querySelectorAll('table').forEach((element) => {
		const tableWrapperDiv = dom.window.document.createElement('div');
		tableWrapperDiv.setAttribute('class', 'table');
		const tableTopWrapper = dom.window.document.createElement('div');
		tableTopWrapper.setAttribute('class', 'table-top');
		const tableBottomWrapper = dom.window.document.createElement('div');
		tableBottomWrapper.setAttribute('class', 'table-bottom');
		dom.window.document.body.replaceChild(tableWrapperDiv, element);
		tableTopWrapper.appendChild(element);
		tableWrapperDiv.appendChild(tableTopWrapper);
		tableWrapperDiv.appendChild(tableBottomWrapper);
	});
	dom.window.document.querySelectorAll('li').forEach((element) => {
		element.innerHTML = element.innerHTML.replaceAll(
			'[Breaking]',
			'<span class="breaking">[Breaking]</span>'
		);
	});
	html = dom.serialize();
	return {
		body: JSON.stringify({
			title: doc.title,
			html
		})
	};
};
