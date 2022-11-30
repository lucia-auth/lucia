import { confirmPrompt, listPrompt } from "../../ui/prompts/index.js";
import { runCommand } from "../utils/node.js";
import { packageManager, PackageManager, PACKAGE_MANAGER } from "./constant.js";

export const installPackages = async (
	dependencies: string[],
	devDependencies: string[],
	{ name: packageManagerPrefix, command }: PackageManager<PACKAGE_MANAGER>
) => {
	const runInstallation =
		await confirmPrompt(`Install the following dependencies using ${packageManagerPrefix}?
${[...dependencies, devDependencies.map((val) => `${val} (dev)`)].join(", ")}`);
	if (!runInstallation) return process.exit(0);
	await runCommand(
		`${packageManagerPrefix} ${command.install} ${dependencies.join(
			" "
		)} && ${packageManagerPrefix} ${command.devInstall} ${devDependencies.join(" ")}`
	);
};

export const selectPackageManager = async (): Promise<PackageManager<PACKAGE_MANAGER>> => {
	const selectedPackageManagerId = await listPrompt(
		"Which package manager to use for installation?",
		[
			[PACKAGE_MANAGER.NPM, "NPM"],
			[PACKAGE_MANAGER.PNPM, "PNPM"],
			[PACKAGE_MANAGER.YARN, "Yarn"]
		]
	);
	return packageManager[selectedPackageManagerId];
};
