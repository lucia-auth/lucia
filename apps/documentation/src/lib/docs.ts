import { formatText } from "./format.js";

const modules = import.meta.glob('../../../../documentation/docs/*/*.md', {
	as: 'raw',
	eager: true
});

const docs = Object.entries(modules)
	.map(([path, raw]) => {
		const relativePath = path.replace('../../../../documentation/docs/', '') as string;
		const sortingReference = relativePath.split('/').includes('index.md')
			? relativePath.split('/')[0]
			: relativePath.replace('.md', '');
		const pathname = '/' + sortingReference.split('_')[1];
		const title = sortingReference.split('_')[1].split('/').at(-1)?.replaceAll('-', ' ') || ""
		return {
			pathname,
			sorting_ref: sortingReference,
			raw,
			title: formatText(title)
		};
	})
	.sort((a, b) => a.sorting_ref.localeCompare(b.sorting_ref));

export default docs;
