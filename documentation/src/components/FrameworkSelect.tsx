import { dynamicClassName } from "src/utils/styles";
import { For, Show, createSignal } from "solid-js";
import frameworks from "src/utils/framework";

export default (props: { frameworkId: string | null }) => {
	const noFrameworkOption = {
		title: "None",
		id: "none"
	};
	const selectedFrameworkOption =
		frameworks.find((option) => option.id === props.frameworkId) ??
		noFrameworkOption;
	const createToggle = () => {
		const [signal, setSignal] = createSignal(false);
		const toggle = () => setSignal((val) => !val);
		return [signal, toggle] as const;
	};
	const [isBoxOpen, toggleBox] = createToggle();
	return (
		<div>
			<button
				class={dynamicClassName(
					"hover:border-main dark:hover:border-main group w-full rounded-md border bg-zinc-50 px-4 py-1.5 text-left dark:bg-zinc-900",
					{
						"border-main": isBoxOpen(),
						"border-zinc-200 dark:border-zinc-800": !isBoxOpen()
					}
				)}
				onClick={toggleBox}
			>
				<span class="text-zinc-400">Framework: </span>
				<span class="group-hover:text-main">
					{selectedFrameworkOption.title}
				</span>
			</button>
			<Show when={isBoxOpen()}>
				<div class="absolute z-50 mt-2 w-48 rounded-md border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
					<ul>
						<For each={[noFrameworkOption, ...frameworks]}>
							{(option) => {
								const href = `${window.location.pathname}?${option.id}`;
								return (
									<li
										class={dynamicClassName("", {
											"text-main": option.id === selectedFrameworkOption.id
										})}
									>
										<a
											class="block w-full px-4 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-950"
											href={href}
										>
											{option.title}
										</a>
									</li>
								);
							}}
						</For>
					</ul>
				</div>
			</Show>
		</div>
	);
};
