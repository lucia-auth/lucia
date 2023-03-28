const createToggleStore = (initialValue = false) => {
	let value = initialValue;
	const subscribers: ((e: boolean) => void)[] = [];
	const subscribe = (callback: (e: boolean) => void) => {
		subscribers.push(callback);
	};
	const update = () => {
		value = !value;
		for (const subscriber of subscribers) {
			subscriber(value);
		}
	};
	return [subscribe, update] as const;
};

export const [onMenuToggle, toggleMenu] = createToggleStore();
