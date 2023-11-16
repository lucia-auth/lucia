import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = "protected"
declare module "E:/lucia/node_modules/.pnpm/nuxt@3.6.5_@types+node@18.17.0/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}