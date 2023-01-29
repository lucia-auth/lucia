import { dynamicClassName } from "@lib/styles";
import { For, Show } from "solid-js";
import type { MarkdownHeading } from "astro";

export default (props: { headings: MarkdownHeading[] }) => {
	return (
		<div class="hidden lg:block pt-36 lg:pt-20 fixed right-0 top-0 w-64 h-screen mr-4 sm:mr-8 lg:mr-12">
			<div class="overflow-auto h-full relative overscroll-contain pl-4">
				<div class="w-full sticky top-0 bg-white dark:bg-black-zinc">
					<h3 class="font-medium">On this page</h3>
				</div>
				<div class="pt-4 pb-8">
					<ul class="list-none text-gray-500 dark:text-zinc-400">
						<li class="my-1">
							<a href="#" class="hover:text-black hover:dark:text-zinc-200">
								Overview
							</a>
						</li>
						<For each={props.headings}>
							{(heading) => {
								const hash = heading.slug.split("/").reverse()[0];
								return (
									<Show when={heading.depth < 4}>
										<li class={dynamicClassName("", {
														"my-1.5": heading.depth === 2,
														"ml-4": heading.depth === 3,
														"my-1": heading.depth > 2
													})}>
											<a
												href={`#${hash}`}
												class="hover:text-black dark:hover:text-zinc-200"
											>
												{heading.text}
											</a>
										</li>
									</Show>
								);
							}}
						</For>
					</ul>
				</div>
			</div>
		</div>
	);
};
