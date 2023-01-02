import { createSignal } from "solid-js";

const createToggle = () => {
	const [signal, setSignal] = createSignal(false);
	const toggle = () => setSignal((val) => !val);
	return [signal, toggle] as const;
};

export const [isMenuOpen, toggleMenuOpen] = createToggle();
