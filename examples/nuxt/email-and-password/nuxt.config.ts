// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	app: {
		head: {
			title: "Email & password auth with Lucia"
		}
	}
	// nitro: {
	// 	moduleSideEffects: ["lucia/polyfill/node"]
	// }
});
