type Callback = (state: boolean) => any;

export const createToggleState = () => {
	const callbacks: Callback[] = [];
	let internal = false;

	const onToggle = (callback: Callback) => {
		callbacks.push(callback);
	};

	const toggle = () => {
		internal = !internal;
		for (const callback of callbacks) {
			callback(internal);
		}
	};

	return [toggle, onToggle] as const;
};

export const [toggleMenu, onMenuToggle] = createToggleState();

export const setElementVisibility = (
	element: HTMLElement,
	visible: boolean
) => {
	if (visible) {
		element.classList.remove("hidden");
	} else {
		element.classList.add("hidden");
	}
};
