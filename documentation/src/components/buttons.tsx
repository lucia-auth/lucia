import { addClassName, removeClassName } from "@lib/dom";
import { dynamicClassName } from "@lib/styles";
import { For, Show, createSignal } from "solid-js";
import frameworks from "@lib/framework";
import { setCookie } from "@lib/cookie";

export const ThemeButton = (props: { initialTheme: string }) => {
	const useTheme = () => {
		let initialTheme = props.initialTheme;
		if (initialTheme !== "light" && initialTheme !== "dark") {
			initialTheme = "light";
		}
		const [signal, setter] = createSignal(initialTheme);
		const toggleTheme = () => {
			const newTheme = signal() === "light" ? "dark" : "light";
			setCookie("theme", newTheme);
			if (newTheme === "light") {
				removeClassName(document.body, "dark");
			}
			if (newTheme === "dark") {
				addClassName(document.body, "dark");
			}
			setter(newTheme);
		};
		return [signal, toggleTheme] as const;
	};
	const [theme, toggleTheme] = useTheme();
	return (
		<button
			class="text-shadow-zinc h-6 w-6 fill-current dark:text-zinc-200"
			onClick={toggleTheme}
			aria-label="Toggle theme"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
				<Show when={theme() === "light"}>
					<path d="M24 42q-7.5 0-12.75-5.25T6 24q0-7.5 5.25-12.75T24 6q.4 0 .85.025.45.025 1.15.075-1.8 1.6-2.8 3.95-1 2.35-1 4.95 0 4.5 3.15 7.65Q28.5 25.8 33 25.8q2.6 0 4.95-.925T41.9 22.3q.05.6.075.975Q42 23.65 42 24q0 7.5-5.25 12.75T24 42Zm0-3q5.45 0 9.5-3.375t5.05-7.925q-1.25.55-2.675.825Q34.45 28.8 33 28.8q-5.75 0-9.775-4.025T19.2 15q0-1.2.25-2.575.25-1.375.9-3.125-4.9 1.35-8.125 5.475Q9 18.9 9 24q0 6.25 4.375 10.625T24 39Zm-.2-14.85Z" />
				</Show>
				<Show when={theme() === "dark"}>
					<path d="M24 42q-7.5 0-12.75-5.25T6 24q0-7.5 5.25-12.75T24 6q.4 0 .85.025.45.025 1.15.075-1.8 1.6-2.8 3.95-1 2.35-1 4.95 0 4.5 3.15 7.65Q28.5 25.8 33 25.8q2.6 0 4.95-.925T41.9 22.3q.05.6.075.975Q42 23.65 42 24q0 7.5-5.25 12.75T24 42Z" />
				</Show>
			</svg>
		</button>
	);
};

export const FrameworkButton = (props: { current?: string | null }) => {
	const currentSelection =
		frameworks.find((option) => option.id === props.current) ?? frameworks[0];
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
					"w-full rounded-md border bg-zinc-50 px-4 py-1.5 text-left dark:bg-zinc-900",
					{
						"border-main": isBoxOpen(),
						"border-zinc-200 dark:border-zinc-800": !isBoxOpen()
					}
				)}
				onClick={toggleBox}
			>
				<span class="text-zinc-500">Framework:</span>
				<span> {currentSelection.title}</span>
			</button>
			<Show when={isBoxOpen()}>
				<div class="absolute z-50 mt-2 w-48 rounded-md border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
					<ul>
						<For each={frameworks}>
							{(option) => {
								const searchParams = new URLSearchParams({
									framework: option.id
								});
								const href = `/?${searchParams}`;
								return (
									<li
										class={dynamicClassName("", {
											"text-main": option.id === currentSelection.id
										})}
									>
										<a
											class="dark:hover:bg-zinc-950 block w-full py-1 px-4 hover:bg-zinc-100"
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
