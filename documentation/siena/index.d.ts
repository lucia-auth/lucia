import type { Root } from "hast";
import type { VFile } from "vfile";
type AstroVFile = Omit<VFile, "data"> & {
    data: {
        astro: Record<string, any>;
    };
};
declare const _default: () => (root: Root, file: AstroVFile) => Promise<void>;
export default _default;
