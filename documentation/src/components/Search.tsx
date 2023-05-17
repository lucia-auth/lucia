import { type QueryResultItem, initializeSearch } from "@search/query";
import { For, Show, createSignal } from "solid-js";
import { generateMarkdownHtml } from "@markdown/index";
import "./Search.module.css";

export const focusOnSearchBar = () => {
	const searchBarElement = document.getElementById("search-bar");
	if (searchBarElement instanceof HTMLInputElement) {
		searchBarElement.focus();
	}
};

const useQuery = (initialQuery?: {
	queryInput: string;
	frameworkId?: string | null;
}) => {
	const [query, onQueryResult] = initializeSearch();
	type State = "load" | "ready" | "query" | "result";
	const [queryResult, setQueryResult] = createSignal<{
		state: State;
		data: QueryResultItem[];
		queryInput: string;
	}>({
		state: "load",
		data: [],
		queryInput: initialQuery?.queryInput ?? ""
	});
	onQueryResult((result, queryInput) => {
		if (queryResult().state === "load" || queryInput.length === 0) {
			return setQueryResult({
				state: "ready",
				data: result,
				queryInput
			});
		}
		return setQueryResult({
			state: "result",
			data: result,
			queryInput
		});
	});
	if (initialQuery) {
		query(initialQuery.queryInput, initialQuery.frameworkId ?? null);
	}
	return [
		(queryInput: string, frameworkId: string | null) => {
			setQueryResult((curr) => {
				return {
					state: "query",
					data: curr.data,
					queryInput
				};
			});
			return query(queryInput, frameworkId);
		},
		queryResult
	] as const;
};

export default (props: {
	frameworkId: string | null;
	collectionId: string | null;
}) => {
	const initialQueryInput = props.collectionId ? `:${props.collectionId} ` : "";
	const [query, queryResult] = useQuery({
		queryInput: initialQueryInput,
		frameworkId: props.frameworkId
	});
	return (
		<div>
			<div class="sticky">
				<p class="text-lg font-medium">Search</p>
				<input
					class="focus:border-main dark:focus:border-main mt-1 block w-full cursor-text rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-left outline-none dark:border-zinc-800 dark:bg-zinc-900"
					id="search-bar"
					onInput={(e) => {
						if (!(e.target instanceof HTMLInputElement)) return;
						query(e.target.value, props.frameworkId);
					}}
					value={initialQueryInput}
				/>
			</div>
			<div class="mt-6">
				<Show
					when={queryResult().state !== "load"}
					fallback={
						<p class="py-4 text-center text-sm text-zinc-400">Loading...</p>
					}
				>
					<>
						<SearchResult result={queryResult().data} />
						<Show
							when={
								queryResult().state === "ready" &&
								queryResult().data.length === 0
							}
						>
							<p class="py-4 text-center text-sm text-zinc-400">
								Tip: Start your query with ":reference" or ":tokens" to filter
								by sections
							</p>
						</Show>
						<Show
							when={
								queryResult().state === "result" &&
								queryResult().data.length === 0
							}
						>
							<p class="py-4 text-center text-sm text-zinc-400">
								No results for "{queryResult().queryInput}"
							</p>
						</Show>
					</>
				</Show>
			</div>
		</div>
	);
};

export const SearchResult = (props: { result: QueryResultItem[] }) => {
	return (
		<For each={props.result}>
			{(resultItem) => {
				return (
					<li class="search-result-item text-shadow-zinc list-none py-2 text-sm leading-relaxed ">
						<a
							href={resultItem.title.pathname}
							class="hover:bg-main  dark:hover:bg-main bg-zinc-80 dark:hover:indigo-100 dark:bg-zinc-850 group block w-full rounded-md px-4 py-3 font-medium hover:text-indigo-100 dark:text-zinc-200"
						>
							<p
								class="font-light text-zinc-400 group-hover:text-indigo-200"
								innerHTML={generateMarkdownHtml(
									resultItem.title.rawSubCollectionTitle
								)}
							></p>
							<p innerHTML={generateMarkdownHtml(resultItem.title.rawText)}></p>
						</a>
						<ul class="pl-6">
							<For each={resultItem.headings}>
								{(heading) => {
									return (
										<li class="my-2 w-full">
											<a
												class="hover:bg-main dark:hover:bg-main bg-zinc-80 dark:hover:indigo-100 dark:bg-zinc-850 block w-full rounded-md px-4 py-3 hover:text-indigo-100 dark:text-zinc-200"
												href={`${heading.pathname}${heading.hash}`}
												innerHTML={generateMarkdownHtml(heading.rawText)}
											></a>
										</li>
									);
								}}
							</For>
						</ul>
					</li>
				);
			}}
		</For>
	);
};
