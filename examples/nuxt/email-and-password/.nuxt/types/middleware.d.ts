import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = "protected"
declare module "E:/lucia/node_modules/.pnpm/nuxt@3.6.5_fl4khuxltvm6fadgpmkxkyqtiu/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}