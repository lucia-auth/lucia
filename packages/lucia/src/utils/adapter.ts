import { Adapter, InitializeAdapter, LuciaErrorConstructor } from "../index.js";

export const joinAdapters = (
  baseAdapter: InitializeAdapter<Adapter>,
  ...adapters: Array<
    | Partial<Adapter>
    // The InitializeAdapter type doesn't currently accept a Partial Adapter, so I've deconstructed it for now
    | ((E: LuciaErrorConstructor) => Partial<Adapter>)
  >
): InitializeAdapter<Adapter> =>
(LuciaError) =>
  Object.assign(
    // Start with the baseAdapter
    baseAdapter(LuciaError),
    // Merge in the partial adapters
    ...adapters.map((adapter) => {
      // Calling them, if they're functions
      if (typeof adapter === "function") return adapter(LuciaError);
      return adapter;
    }),
  );
