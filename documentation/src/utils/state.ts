const createStore = <V>(initialValue: V) => {
	let value = initialValue;
	const subscribers: ((e: V) => void)[] = [];
	const subscribe = (callback: (e: V) => void) => {
		subscribers.push(callback);
	};
	const set = (newValue: V | ((val: V) => V)) => {
		if (newValue instanceof Function) {
			newValue = newValue(value);
		}
		value = newValue;
		for (const subscriber of subscribers) {
			subscriber(value);
		}
	};
	return [subscribe, set] as const;
};

export const [onMenuStateUpdate, setMenuState] = createStore(false);
export const [onSearchMenuStateUpdate, setSearchMenuState] = createStore(false);
