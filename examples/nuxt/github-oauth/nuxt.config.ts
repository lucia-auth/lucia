// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	app: {
		head: {
			title: "GitHub OAuth with Lucia"
		}
	},
	runtimeConfig: {
		githubClientId: "",
		githubClientSecret: ""
	}
	// nitro: {
	// 	moduleSideEffects: ["lucia/polyfill/node"]
	// }
});
