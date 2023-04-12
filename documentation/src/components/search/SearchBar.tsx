export const focusOnSearchBar = () => {
	const searchBarElement = document.getElementById("search-bar");
	if (searchBarElement instanceof HTMLInputElement) {
		searchBarElement.focus();
	}
};

export default () => {
	return (
		<input
			class="focus:border-main mt-2 block w-full cursor-text rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-left outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-main"
			id="search-bar"
		/>
	);
};
