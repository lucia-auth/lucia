import type { Adapter } from "lucia-sveltekit/dist/types";
declare const adapter: (url: string, secret: string) => Adapter;
export default adapter;
