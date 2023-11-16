import { ComputedRef, Ref } from 'vue'
export type LayoutKey = string
declare module "E:/lucia/node_modules/.pnpm/nuxt@3.6.5_fl4khuxltvm6fadgpmkxkyqtiu/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: false | LayoutKey | Ref<LayoutKey> | ComputedRef<LayoutKey>
  }
}