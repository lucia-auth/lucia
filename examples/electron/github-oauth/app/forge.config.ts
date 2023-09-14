import type { ForgeConfig } from "@electron-forge/shared-types";

import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";

const config: ForgeConfig = {
	packagerConfig: {
		protocols: [
			{
				name: "Electron Fiddle",
				schemes: ["electron-app"]
			}
		]
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ["darwin"]),
		new MakerRpm({}),
		new MakerDeb({
			options: {
				mimeType: ["x-scheme-handler/electron-app"]
			}
		})
	],
	plugins: [
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [
				{
					// `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
					entry: "src/main.ts",
					config: "vite.main.config.ts"
				},
				{
					entry: "src/preload.ts",
					config: "vite.preload.config.ts"
				}
			],
			renderer: [
				{
					name: "main_window",
					config: "vite.renderer.config.ts"
				}
			]
		})
	]
};

export default config;
