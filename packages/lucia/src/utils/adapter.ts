import type {
	Adapter,
	InitializeAdapter,
	SessionAdapter,
	UserAdapter
} from "../index.js";

export const joinAdapters = (
	baseAdapter: InitializeAdapter<Adapter | SessionAdapter | UserAdapter>,
	...adapters: Array<
		Partial<Adapter> | InitializeAdapter<Adapter | SessionAdapter | UserAdapter>
	>
): InitializeAdapter<Adapter> => {
	return (LuciaError) => {
		return Object.assign(
			// start with the baseAdapter
			baseAdapter(LuciaError),
			// merge in the partial adapters
			...adapters.map((adapter) => {
				if (typeof adapter === "function") return adapter(LuciaError);
				return adapter;
			})
		);
	};
};
