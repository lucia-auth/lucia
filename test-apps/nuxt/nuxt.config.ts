// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxtjs/tailwindcss"],
    app: {
        rootTag: "main"
    },
    nitro: {
        moduleSideEffects: ["lucia-auth/polyfill/node"]
    }
});
