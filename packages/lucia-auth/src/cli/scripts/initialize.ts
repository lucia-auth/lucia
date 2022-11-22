import fs from "fs";
import path from "path";
import { confirmPrompt } from "../ui/prompts/index.js";
import { message } from "../ui/message.js"

enum Framework {
	None = "NONE",
	SvelteKit = "SVELTEKIT",
	NextJS = "NEXTJS",
	Astro = "ASTRO"
}

const frameworkName = {
    SVELTEKIT: "SvelteKit",
    NONE: "",
    NEXTJS: "Next.js",
    ASTRO: "Astro"
} satisfies Record<Framework, string>

const detectFramework = (): Framework => {
	const fileExists = (name: string) => {
		return fs.existsSync(path.resolve(process.cwd(), `./${name}`));
	};
	if (fileExists("./svelte.config.js")) return Framework.SvelteKit;
	if (fileExists("./next.config.js")) return Framework.NextJS;
	if (fileExists("./astro.config.mjs")) return Framework.Astro;
	return Framework.None;
};

const initializeCommand = async () => {
    message("Welcome to Lucia!")
	const detectedFramework = detectFramework();
    let framework: null | Framework = null
	if (detectedFramework !== Framework.None) {
		const useDetectedProject = await confirmPrompt(`Detected a ${frameworkName[detectedFramework]} project - continue with this framework?`);
        if (useDetectedProject) {
            message(`Continuing the initialization with ${detectedFramework}`)
        } else {
            message("Just using the core library")
        }
        framework = useDetectedProject ? detectedFramework : null
	} else {
        message("Couldn't detect a supported framework - just using the core library")
	}
};

initializeCommand();
