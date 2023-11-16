type Callback<T> = (state: T) => any;

export const createToggleState = () => {
	const [state, onUpdate] = createState(false);
	const toggleState = {
		value: state.value,
		toggle: () => state.set(!state.value())
	} as const;
	return [toggleState, onUpdate] as const;
};

export const createState = <T>(initialState: T) => {
	const callbacks: Callback<T>[] = [];
	let internal = initialState;

	const onUpdate = (callback: Callback<T>) => {
		callbacks.push(callback);
	};
	const state = {
		value: () => internal,
		set: (value: T) => {
			if (value !== undefined) {
				internal = value;
				for (const callback of callbacks) {
					callback(internal);
				}
			}
			return internal;
		}
	} as const;
	return [state, onUpdate] as const;
};

export const [menuVisible, onMenuToggle] = createToggleState();
export const [searchVisible, onSearchVisibilityUpdate] = createState(false);
