import { toggleMenuOpen } from "@lib/state";
import { dynamicClassName } from "@lib/styles";
import { For, Show, createSignal } from "solid-js";
import frameworks from "src/framework";

export const MenuButton = () => {
	return (
		<button
			onClick={toggleMenuOpen}
			class="xl:hidden"
			aria-label="Toggle menubar"
		>
			<div class="h-8 w-8 dark:text-zinc-200 fill-current">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 48 48"
					class="w-full h-full"
				>
					<path d="M6 36v-3h36v3Zm0-10.5v-3h36v3ZM6 15v-3h36v3Z" />
				</svg>
			</div>
		</button>
	);
};

export const ThemeButton = () => {
	type Theme = "light" | "dark";
	const useTheme = () => {
		const initialTheme: Theme =
			typeof document !== "undefined"
				? (window.localStorage.getItem("theme") as Theme)
				: "light";
		const [signal, setter] = createSignal<Theme>(initialTheme);
		const toggleTheme = () => {
			const newTheme: Theme = signal() === "light" ? "dark" : "light";
			setter(newTheme);
			window.localStorage.setItem("theme", newTheme);
			if (newTheme === "light") {
				document.documentElement.classList.remove("dark");
			} else {
				document.documentElement.classList.add("dark");
			}
		};
		return [signal, toggleTheme] as const;
	};
	const [theme, toggleTheme] = useTheme();
	return (
		<button
			class="h-6 w-6 fill-current dark:text-zinc-200 text-black-zinc"
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
					"w-full px-4 py-1.5 text-left  rounded-md bg-zinc-50 border ",
					{
						"border-main": isBoxOpen(),
						"border-zinc-200": !isBoxOpen()
					}
				)}
				onClick={toggleBox}
			>
				<span class="text-zinc-500">Framework:</span>
				<span> {currentSelection.title}</span>
			</button>
			<div
				class={
					isBoxOpen()
						? "absolute bg-white shadow-lg rounded-md z-50 w-48 py-2 mt-2 border border-zinc-200"
						: "hidden"
				}
			>
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
										class="hover:bg-zinc-100 py-1 px-4 w-full block"
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
		</div>
	);
};
