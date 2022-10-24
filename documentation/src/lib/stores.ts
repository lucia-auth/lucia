import { writable } from "svelte/store";

const { subscribe, update } = writable(false);

export const isMenuOpen = {
	subscribe,
	toggle: () => update((val) => !val)
};
